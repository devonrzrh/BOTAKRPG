"""Build and export ECHO-7 in an isolated Blender process.

blender --background --factory-startup --python scripts/model-echo.py
"""

import json
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
PALETTE = [
    ("Graphite", (0.11, 0.17, 0.22, 1)),
    ("Ceramic alloy", (0.50, 0.67, 0.74, 1)),
    ("Red signal", (1.0, 0.15, 0.22, 1)),
]
# Positions in Blender's X/depth/elevation axes. The TypeScript rig swaps Y and Z.
ORIGINS = {
    "head": (0, -0.08, 2.69),
    "left": (-1.05, 0, 1.8),
    "right": (1.05, 0, 1.8),
    "spine-0": (-0.69, 0.31, 0.46),
    "spine-1": (-0.87, 0.24, 0.79),
    "spine-2": (-0.53, 0.17, 1.10),
    "spine-3": (0.04, 0.21, 1.40),
    "spine-4": (0.31, 0.27, 1.79),
    "spine-5": (0.21, 0.23, 2.17),
}


def build():
    collection = bpy.data.collections.new("ECHO-7")
    bpy.context.scene.collection.children.link(collection)
    materials = []
    for name, color in PALETTE:
        material = bpy.data.materials.new(name)
        material.diffuse_color = color
        material.use_nodes = True
        shader = next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        shader.inputs["Base Color"].default_value = color
        shader.inputs["Metallic"].default_value = 0.35
        shader.inputs["Roughness"].default_value = 0.35
        if len(materials) == 2:
            shader.inputs["Emission Color"].default_value = color
            shader.inputs["Emission Strength"].default_value = 1.0
        materials.append(material)

    def plate(name, rig, center, outline, depth, surface, bevel):
        """Extrude an XZ silhouette with a raised front and tapered rear."""
        count = len(outline)
        vertices = [
            (x * scale, y * depth, z * scale)
            for y, scale in [(-0.5, 0.83), (-0.24, 1), (0.5, 0.79)]
            for x, z in outline
        ]
        faces = [tuple(range(count)), tuple(range(2 * count, 3 * count))]
        for layer in (0, count):
            for i in range(count):
                j = (i + 1) % count
                faces.append((layer + i, layer + j, layer + j + count, layer + i + count))
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new(name, mesh)
        collection.objects.link(obj)
        obj.location = Vector(ORIGINS[rig]) + Vector(center)
        obj["rig"] = rig
        obj["surface"] = surface
        mesh.materials.append(materials[surface])
        modifier = obj.modifiers.new("Machined edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2 if rig == "head" and surface != 2 else 1

    plate("Skull", "head", (0, 0.02, 0), [
        (-0.76, 0.14), (-0.59, 0.46), (0, 0.54), (0.59, 0.46),
        (0.76, 0.14), (0.51, -0.31), (0.17, -0.50), (-0.17, -0.50), (-0.51, -0.31),
    ], 0.85, 0, 0.045)
    plate("Crown shield", "head", (0, -0.36, 0.27), [
        (-0.68, 0.03), (-0.51, 0.23), (0, 0.30), (0.51, 0.23),
        (0.68, 0.03), (0.30, -0.15), (0, -0.21), (-0.30, -0.15),
    ], 0.28, 1, 0.032)
    plate("Optic housing", "head", (0, -0.46, 0.02), [
        (-0.57, 0.17), (0, 0.02), (0.57, 0.17), (0.43, -0.10),
        (0, -0.19), (-0.43, -0.10),
    ], 0.24, 0, 0.027)
    plate("Split visor", "head", (0, -0.59, 0.05), [
        (-0.55, 0.12), (0, -0.01), (0.55, 0.12), (0.38, -0.065),
        (0.12, -0.125), (0, -0.24), (-0.12, -0.125), (-0.38, -0.065),
    ], 0.075, 2, 0.012)
    plate("Chin guard", "head", (0, -0.32, -0.30), [
        (-0.40, 0.09), (0, -0.03), (0.40, 0.09),
        (0.24, -0.16), (0, -0.23), (-0.24, -0.16),
    ], 0.29, 1, 0.025)

    for side, arm in [(-1, "left"), (1, "right")]:
        def mirror(outline):
            return [(side * x, z) for x, z in outline]

        plate("Swept antenna", "head", (side * 0.49, 0.09, 0.35), mirror([
            (-0.22, -0.08), (-0.12, 0.15), (0.25, 0.42), (0.44, 0.63),
            (0.39, 0.26), (0.16, -0.17),
        ]), 0.34, 1, 0.028)
        plate("Antenna channel", "head", (side * 0.49, -0.07, 0.36), mirror([
            (-0.05, 0), (0.21, 0.26), (0.36, 0.48), (0.26, 0.17), (0.04, -0.07),
        ]), 0.08, 2, 0.012)

        stagger = 0.10 if side > 0 else -0.06
        plate("Blade carrier", arm, (0, 0.12, stagger), mirror([
            (-0.42, 0.35), (-0.05, 0.43), (0.42, 0.15), (0.54, -0.26),
            (0.34, -0.61), (0.05, -0.52), (-0.17, -0.16),
        ]), 0.54, 0, 0.039)
        plate("Scythe", arm, (0, -0.10, stagger), mirror([
            (-0.33, 0.20), (0, 0.49), (0.48, 0.30), (0.72, -0.10),
            (0.68, -0.57), (0.29, -1.10), (0.35, -0.61), (0.12, -0.32),
        ]), 0.32, 1, 0.034)
        plate("Blade trace", arm, (0, -0.265, stagger), mirror([
            (-0.14, 0.16), (0.04, 0.31), (0.38, 0.18), (0.53, -0.11),
            (0.50, -0.38), (0.40, -0.20), (0.31, 0.04), (0.03, 0.17),
        ]), 0.075, 2, 0.013)

    scales = (0.36, 0.50, 0.65, 0.79, 0.91, 1)
    for i, scale in enumerate(scales):
        rig = f"spine-{i}"

        def taper(outline):
            return [(x * scale, z * scale) for x, z in outline]

        plate("Vertebra", rig, (0, 0, 0), taper([
            (-0.51, 0.12), (-0.26, 0.29), (0.32, 0.24), (0.53, 0.07),
            (0.32, -0.23), (0, -0.36), (-0.34, -0.20),
        ]), 0.68 * scale, 0, 0.023 * scale)
        plate("Interlocking scale", rig, (0, -0.27 * scale, 0.03), taper([
            (-0.55, 0.09), (-0.31, 0.24), (0.33, 0.20), (0.55, 0.07),
            (0.23, -0.10), (-0.04, -0.23), (-0.25, -0.08),
        ]), 0.25 * scale, 1, 0.028 * scale)
        plate("Spine signal", rig, (0, -0.405 * scale, -0.05), taper([
            (-0.29, 0.09), (-0.04, -0.04), (0.32, 0.09),
            (0.21, -0.04), (-0.05, -0.17), (-0.22, -0.04),
        ]), 0.07 * scale, 2, 0.01 * scale)
    return collection


def export_model(collection):
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    groups = {}
    for obj in sorted(collection.objects, key=lambda item: item.name):
        rig, surface = obj["rig"], obj["surface"]
        positions, normals, indices, lookup = groups.setdefault((rig, surface), ([], [], [], {}))
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        for triangle in mesh.loop_triangles:
            for loop_index in triangle.loops:
                loop = mesh.loops[loop_index]
                p = obj.matrix_world @ mesh.vertices[loop.vertex_index].co - Vector(ORIGINS[rig])
                n = mesh.corner_normals[loop_index].vector
                position = tuple(round(value, 4) for value in (p.x, p.z, p.y))
                normal = tuple(round(value, 3) for value in (n.x, n.z, n.y))
                vertex = position + normal
                if vertex not in lookup:
                    lookup[vertex] = len(positions) // 3
                    positions.extend(position)
                    normals.extend(normal)
                indices.append(lookup[vertex])
        evaluated.to_mesh_clear()
    parts = [
        dict(rig=rig, material=surface, positions=positions, normals=normals, indices=indices)
        for (rig, surface), (positions, normals, indices, _) in sorted(groups.items())
    ]
    pivots = {rig: [x, z, y] for rig, (x, y, z) in ORIGINS.items()}
    target = ROOT / "src" / "world" / "echoMesh.json"
    compact = dict(separators=(",", ":"))
    target.write_text(
        '{"pivots":' + json.dumps(pivots, **compact) + ',\n"parts":[\n'
        + ",\n".join(json.dumps(part, **compact) for part in parts) + "\n]}\n",
        encoding="utf-8",
    )
    print(f"ECHO-7: {len(parts)} meshes, {sum(len(p['indices']) // 3 for p in parts)} triangles")


if __name__ == "__main__":
    export_model(build())
