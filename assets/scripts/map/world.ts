import { _decorator, CCFloat, Component, instantiate, Prefab, Vec3 } from 'cc';

import { Chunk } from './chunk';
import { ChunkData } from './chunkData';
import { ChunkRenderer } from './chunkRenderer';
import { BlockType } from './models';
import { simplePerlinNoise } from './utils';
const { ccclass, property } = _decorator;

@ccclass('World')
export class World extends Component {
    @property
    mapSizeInChunks!: number;

    @property
    chunkSize!: number;

    @property
    chunkHeight!: number;

    @property
    waterThreshold!: number;

    @property({ type: CCFloat })
    noiseScale!: number;

    @property(Prefab)
    chunkPrefab!: Prefab;

    chunkDataDictionary: Map<Vec3, ChunkData> = new Map<Vec3, ChunkData>();
    chunkDictionary: Map<Vec3, ChunkRenderer> = new Map<Vec3, ChunkRenderer>();

    generateWorld(): void {
        this.cleanUpWorldData();

        for (let x = 0; x < this.mapSizeInChunks; x++) {
            for (let z = 0; z < this.mapSizeInChunks; z++) {
                const data = new ChunkData(
                    this,
                    new Vec3(x * this.chunkSize, 0, z * this.chunkSize),
                    this.chunkSize,
                    this.chunkHeight
                );
                this.generateVoxels(data);
                this.chunkDataDictionary.set(data.worldPosition, data);
            }
        }

        for (const data of this.chunkDataDictionary.values()) {
            const meshData = Chunk.getMeshData(data);
            const chunkObject = instantiate(this.chunkPrefab);

            chunkObject.setPosition(data.worldPosition);

            const chunkRenderer = chunkObject.getComponent(ChunkRenderer)!;
            this.chunkDictionary.set(data.worldPosition, chunkRenderer);

            chunkRenderer.initChunk(data);
            chunkRenderer.updateChunkWithData(meshData);

            // chunkRenderer.meshRender.onGeometryChanged();
            // chunkRenderer.meshRenderWater.onGeometryChanged();

            this.node.addChild(chunkObject);
        }
    }

    getBlockFromChunkCoordinates(x: number, y: number, z: number): BlockType {
        const pos: Vec3 = Chunk.chunkPositionFromBlockCoords(this, x, y, z);
        const containerChunk: ChunkData | undefined = this.chunkDataDictionary.get(pos);

        if (containerChunk === undefined) {
            return BlockType.Empty;
        }

        const blockInChunkCoordinates: Vec3 = Chunk.getBlockInChunkCoordinates(containerChunk, new Vec3(x, y, z));
        return Chunk.getBlockFromChunkCoordinatesVec3(containerChunk, blockInChunkCoordinates);
    }

    private generateVoxels(data: ChunkData): void {
        for (let x = 0; x < data.chunkSize; x++) {
            for (let z = 0; z < data.chunkSize; z++) {
                this.generateColumnVoxels(data, x, z);
            }
        }
    }

    private generateColumnVoxels(data: ChunkData, x: number, z: number): void {
        const noiseValue = simplePerlinNoise(
            (data.worldPosition.x + x) * this.noiseScale,
            (data.worldPosition.z + z) * this.noiseScale
        );

        const groundPosition = Math.round(noiseValue * this.chunkHeight);

        for (let y = 0; y < this.chunkHeight; y++) {
            const voxelType = this.getVoxelType(y, groundPosition);
            Chunk.setBlock(data, new Vec3(x, y, z), voxelType);
        }
    }

    private getVoxelType(y: number, groundPosition: number): BlockType {
        if (y > groundPosition) {
            return y < this.waterThreshold ? BlockType.Water : BlockType.Air;
        }

        if (y === groundPosition) {
            return BlockType.GrassDirt;
        }

        return BlockType.Dirt;
    }

    private cleanUpWorldData(): void {
        this.chunkDataDictionary.clear();
        for (const chunk of this.chunkDictionary.values()) {
            chunk.node.destroy();
        }
        this.chunkDictionary.clear();
    }
}
