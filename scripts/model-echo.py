"""Build and export ECHO-7 in an isolated Blender process.

blender --background --factory-startup --python scripts/model-echo.py
"""

import json
from math import cos, sin, tau
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
PALETTE = [
    ("Graphite", (0.09, 0.13, 0.16, 1)),
    ("Brushed alloy", (0.42, 0.45, 0.48, 1)),
    ("Red signal", (1.0, 0.15, 0.22, 1)),
]
# Positions in Blender's X/depth/elevation axes. The TypeScript rig swaps Y and Z.
ORIGINS = {
    "body": (0, 0, 0),
    "head": (0, -0.02, 3.09),
    "left": (-0.96, 0, 2.44),
    "right": (0.96, 0, 2.44),
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

    def block(name, rig, center, width, height, depth, surface, bevel=0.025, taper=1):
        w, h = width / 2, height / 2
        plate(name, rig, center, [
            (-w * taper, -h), (w * taper, -h), (w, h), (-w, h),
        ], depth, surface, bevel)

    def hub(name, rig, center, radius, depth, surface, sides=10):
        outline = [
            (radius * cos(tau * i / sides), radius * sin(tau * i / sides))
            for i in range(sides)
        ]
        plate(name, rig, center, outline, depth, surface, 0.009)

    block("Neck", "body", (0, 0.08, 2.80), 0.35, 0.35, 0.40, 0)
    plate("Helmet shell", "head", (0, 0, 0), [
        (-0.44, 0.17), (-0.31, 0.36), (0.28, 0.36), (0.43, 0.16),
        (0.40, -0.15), (0.23, -0.31), (-0.20, -0.31), (-0.39, -0.16),
    ], 0.68, 0, 0.04)
    plate("Face mask", "head", (0, -0.32, 0.03), [
        (-0.37, 0.20), (-0.24, 0.27), (0.26, 0.25), (0.36, 0.14),
        (0.27, -0.04), (0.12, -0.03), (0, -0.14), (-0.12, -0.03), (-0.28, -0.05),
    ], 0.24, 1, 0.024)
    plate("Dark optic recess", "head", (0, -0.445, 0), [
        (-0.32, 0.095), (-0.13, 0.07), (0, 0.035), (0.13, 0.07),
        (0.32, 0.095), (0.29, -0.065), (0, -0.13), (-0.29, -0.065),
    ], 0.09, 0, 0.012)
    plate("Lower jaw", "head", (0, -0.34, -0.19), [
        (-0.27, 0.10), (-0.14, 0.02), (0.14, 0.02), (0.27, 0.10),
        (0.18, -0.13), (-0.18, -0.13),
    ], 0.26, 1, 0.025)
    block("Antenna", "head", (0.27, 0.15, 0.39), 0.09, 0.23, 0.12, 0)
    block("Antenna lamp", "head", (0.27, 0.15, 0.51), 0.09, 0.035, 0.12, 2)

    plate("Chest frame", "body", (0, 0.045, 2.23), [
        (-0.90, 0.32), (-0.52, 0.56), (0.52, 0.56), (0.90, 0.32),
        (0.72, -0.25), (0.36, -0.52), (-0.36, -0.52), (-0.72, -0.25),
    ], 0.92, 0, 0.05)
    block("Waist swivel", "body", (0, 0, 1.63), 0.66, 0.34, 0.51, 0)
    for i in range(3):
        block("Abdomen rib", "body", (0, -0.26, 1.51 + i * 0.11), 0.62, 0.065, 0.18, 1)
    block("Pelvis", "body", (0, 0.03, 1.34), 1.02, 0.35, 0.64, 0, taper=0.79)
    block("Hip guard", "body", (0, -0.30, 1.34), 0.48, 0.26, 0.12, 1, taper=0.66)
    hub("Reactor collar", "body", (0, -0.42, 2.24), 0.32, 0.23, 1, sides=8)
    hub("Reactor well", "body", (0, -0.535, 2.24), 0.23, 0.095, 0, sides=8)
    hub("Reactor lens", "body", (0, -0.59, 2.24), 0.165, 0.08, 2, sides=8)

    for side, arm in [(-1, "left"), (1, "right")]:
        def mirror(outline):
            return [(side * x, z) for x, z in outline]

        plate("Eye", "head", (side * 0.17, -0.49, 0.015), mirror([
            (-0.105, -0.01), (0.12, 0.057), (0.10, -0.025), (-0.087, -0.055),
        ]), 0.05, 2, 0.006)
        hub("Temple bearing", "head", (side * 0.366, -0.14, 0), 0.13, 0.25, 1)
        plate("Breastplate", "body", (side * 0.42, -0.34, 2.45), mirror([
            (-0.36, 0.11), (-0.17, 0.30), (0.26, 0.24), (0.43, 0.01),
            (0.18, -0.24), (-0.10, -0.23),
        ]), 0.28, 1, 0.028)
        for i in range(2):
            block("Chest vent", "body", (side * 0.49, -0.415, 2.06 + i * 0.09),
                  0.29, 0.046, 0.10, 0, bevel=0.011)

        block("Upper arm actuator", arm, (side * 0.12, 0.02, -0.31), 0.34, 0.60, 0.44, 0)
        hub("Shoulder bearing", arm, (side * 0.07, 0, -0.04), 0.28, 0.55, 0)
        ridge = 0.34 if side < 0 else 0.23
        plate("Shoulder armor", arm, (side * 0.12, -0.15, 0.04), mirror([
            (-0.26, 0.10), (-0.08, ridge), (0.26, ridge - 0.06), (0.44, 0.025),
            (0.31, -0.23), (-0.22, -0.23),
        ]), 0.62, 1, 0.045)
        block("Shoulder inset", arm, (side * 0.16, -0.46, 0.13), 0.29, 0.09, 0.08, 0)
        block("Shoulder lamp", arm, (side * 0.16, -0.505, 0.13), 0.20, 0.038, 0.048, 2)
        hub("Elbow bearing", arm, (side * 0.23, -0.07, -0.57), 0.17, 0.45, 1)
        block("Forearm casing", arm, (side * 0.23, -0.115, -0.81), 0.45, 0.53, 0.51, 0, taper=0.72)
        plate("Forearm guard", arm, (side * 0.23, -0.34, -0.82), mirror([
            (-0.18, 0.23), (0.18, 0.25), (0.26, 0.06),
            (0.13, -0.25), (-0.12, -0.19),
        ]), 0.20, 1, 0.025)
        block("Forearm inlay", arm, (side * 0.26, -0.45, -0.80), 0.06, 0.26, 0.055, 2)
        block("Hand", arm, (side * 0.24, -0.19, -1.15), 0.34, 0.28, 0.33, 0)
        for finger in range(3):
            block("Finger knuckle", arm, (side * (0.13 + finger * 0.11), -0.31, -1.23),
                  0.079, 0.22, 0.15, 1, bevel=0.012)
        block("Thumb", arm, (side * 0.065, -0.22, -1.15), 0.10, 0.19, 0.18, 0)

        leg = side * 0.43
        block("Thigh actuator", "body", (leg, 0.055, 1.05), 0.40, 0.52, 0.47, 0)
        block("Thigh plate", "body", (leg, -0.18, 1.08), 0.44, 0.41, 0.25, 1, taper=0.76)
        hub("Knee bearing", "body", (leg, -0.11, 0.76), 0.22, 0.47, 0)
        hub("Knee cap", "body", (leg, -0.325, 0.76), 0.19, 0.18, 1, sides=6)
        boot = leg + side * 0.08
        block("Shin housing", "body", (boot, 0, 0.43), 0.48, 0.58, 0.54, 0, taper=1.15)
        plate("Shin guard", "body", (boot, -0.25, 0.43), mirror([
            (-0.15, 0.25), (0.15, 0.25), (0.23, 0.11),
            (0.20, -0.24), (-0.20, -0.24),
        ]), 0.25, 1, 0.035)
        block("Ankle seal", "body", (boot, -0.39, 0.36), 0.07, 0.21, 0.05, 2)
        block("Boot", "body", (boot, -0.14, 0.14), 0.53, 0.28, 0.87, 0, taper=1.08)
        block("Boot toe", "body", (boot, -0.48, 0.15), 0.49, 0.19, 0.30, 1)
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
