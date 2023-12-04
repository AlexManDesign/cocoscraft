import { _decorator, Vec2, Vec3 } from 'cc';

import { BlockDataManager } from './blockDataManager';
import { Chunk } from './chunk';
import { ChunkData } from './chunkData';
import { MeshData } from './meshData';
import { BlockDirection, BlockType } from './models';
import { getVector } from './utils/directionHelper';

const { ccclass } = _decorator;

@ccclass('BlockHelper')
export class BlockHelper {
    private static directions: BlockDirection[] = [
        BlockDirection.Back,
        BlockDirection.Down,
        BlockDirection.Forward,
        BlockDirection.Left,
        BlockDirection.Right,
        BlockDirection.Up,
    ];

    static getMeshData(
        chunk: ChunkData,
        x: number,
        y: number,
        z: number,
        meshData: MeshData,
        blockType: BlockType
    ): MeshData {
        if (blockType === BlockType.Air || blockType === BlockType.Empty) return meshData;

        for (const direction of this.directions) {
            const neighbourBlockCoordinates = new Vec3(x, y, z).add(getVector(direction));
            const neighbourBlockType = Chunk.getBlockFromChunkCoordinatesVec3(chunk, neighbourBlockCoordinates);

            const isSolid = BlockDataManager.blockTextureDataDictionary.get(neighbourBlockType)?.isSolid;

            if (neighbourBlockType === BlockType.Empty || !isSolid) {
                if (blockType === BlockType.Water && neighbourBlockType === BlockType.Air) {
                    meshData.waterMesh = this.getFaceDataIn(direction, x, y, z, meshData.waterMesh, blockType);
                } else {
                    meshData = this.getFaceDataIn(direction, x, y, z, meshData, blockType);
                }
            }
        }

        return meshData;
    }

    static getFaceDataIn(
        direction: BlockDirection,
        x: number,
        y: number,
        z: number,
        meshData: MeshData,
        blockType: BlockType
    ): MeshData {
        this.getFaceVertices(direction, x, y, z, meshData, blockType);
        meshData.addQuadTriangle(BlockDataManager.blockTextureDataDictionary.get(blockType).generatesCollider);
        meshData.uv.push(...this.faceUVs(direction, blockType));

        return meshData;
    }

    static getFaceVertices(
        direction: BlockDirection,
        x: number,
        y: number,
        z: number,
        meshData: MeshData,
        blockType: BlockType
    ): void {
        const generatesCollider = BlockDataManager.blockTextureDataDictionary.get(blockType).generatesCollider;

        const addVertex = (dx: number, dy: number, dz: number): void => {
            meshData.addVertex(new Vec3(x + dx, y + dy, z + dz), generatesCollider);
        };

        switch (direction) {
            case BlockDirection.Back:
                addVertex(-0.5, -0.5, -0.5);
                addVertex(-0.5, 0.5, -0.5);
                addVertex(0.5, 0.5, -0.5);
                addVertex(0.5, -0.5, -0.5);
                break;
            case BlockDirection.Forward:
                addVertex(0.5, -0.5, 0.5);
                addVertex(0.5, 0.5, 0.5);
                addVertex(-0.5, 0.5, 0.5);
                addVertex(-0.5, -0.5, 0.5);
                break;
            case BlockDirection.Left:
                addVertex(-0.5, -0.5, 0.5);
                addVertex(-0.5, 0.5, 0.5);
                addVertex(-0.5, 0.5, -0.5);
                addVertex(-0.5, -0.5, -0.5);
                break;
            case BlockDirection.Right:
                addVertex(0.5, -0.5, -0.5);
                addVertex(0.5, 0.5, -0.5);
                addVertex(0.5, 0.5, 0.5);
                addVertex(0.5, -0.5, 0.5);
                break;
            case BlockDirection.Down:
                addVertex(-0.5, -0.5, -0.5);
                addVertex(0.5, -0.5, -0.5);
                addVertex(0.5, -0.5, 0.5);
                addVertex(-0.5, -0.5, 0.5);
                break;
            case BlockDirection.Up:
                addVertex(-0.5, 0.5, 0.5);
                addVertex(0.5, 0.5, 0.5);
                addVertex(0.5, 0.5, -0.5);
                addVertex(-0.5, 0.5, -0.5);
                break;
            default:
                break;
        }
    }

    static faceUVs(direction: BlockDirection, blockType: BlockType): Vec2[] {
        const uv: Vec2[] = [];

        const tilePos = this.texturePosition(direction, blockType);

        const originalUV = [
            new Vec2(
                BlockDataManager.tileSizeX * tilePos.x + BlockDataManager.textureOffset,
                BlockDataManager.tileSizeY * tilePos.y + BlockDataManager.textureOffset
            ),
            new Vec2(
                BlockDataManager.tileSizeX * tilePos.x + BlockDataManager.tileSizeX - BlockDataManager.textureOffset,
                BlockDataManager.tileSizeY * tilePos.y + BlockDataManager.textureOffset
            ),
            new Vec2(
                BlockDataManager.tileSizeX * tilePos.x + BlockDataManager.tileSizeX - BlockDataManager.textureOffset,
                BlockDataManager.tileSizeY * tilePos.y + BlockDataManager.tileSizeY - BlockDataManager.textureOffset
            ),
            new Vec2(
                BlockDataManager.tileSizeX * tilePos.x + BlockDataManager.textureOffset,
                BlockDataManager.tileSizeY * tilePos.y + BlockDataManager.tileSizeY - BlockDataManager.textureOffset
            ),
        ];

        // Apply a 90 degree rotation to the UVs by shifting the coordinates to the right by one position
        uv[0] = originalUV[3];
        uv[1] = originalUV[0];
        uv[2] = originalUV[1];
        uv[3] = originalUV[2];

        return uv;
    }

    static texturePosition(direction: BlockDirection, blockType: BlockType): Vec2 {
        const texturePositions = getTexturePositions(blockType);
        return texturePositions[direction] || texturePositions.default;
    }
}

const getTexturePositions = (
    blockType: BlockType
): {
    [BlockDirection.Up]: Vec2;
    [BlockDirection.Down]: Vec2;
    default: Vec2;
} => {
    return {
        [BlockDirection.Up]: BlockDataManager.blockTextureDataDictionary.get(blockType).up,
        [BlockDirection.Down]: BlockDataManager.blockTextureDataDictionary.get(blockType).down,
        default: BlockDataManager.blockTextureDataDictionary.get(blockType).side,
    };
};
