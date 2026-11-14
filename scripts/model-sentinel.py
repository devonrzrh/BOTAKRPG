"""Build and export Sentinel A-03 with Blender.

blender --background --factory-startup --python scripts/model-sentinel.py
"""
import json
from math import pi
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

palette = [
    ("Anodized gunmetal", (0.09, 0.15, 0.19, 1)),
    ("Ceramic alloy", (0.37, 0.47, 0.50, 1)),
    ("Amber signal", (0.90, 0.52, 0.13, 1)),
]
materials = []
for index, (name, rgba) in enumerate(palette):
    material = bpy.data.materials.new(name)
    material.diffuse_color = rgba
    material.use_nodes = True
    shader = next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Metallic"].default_value = 0.6 if index < 2 else 0.1
    shader.inputs["Roughness"].default_value = 0.32
    if index == 2:
        shader.inputs["Emission Color"].default_value = rgba
        shader.inputs["Emission Strength"].default_value = 1.2
    materials.append(material)


def finish(obj, name, surface, bevel, rig="body"):
    obj.name = name
    obj.data.materials.append(materials[surface])
    obj["surface"] = surface
    obj["rig"] = rig
    if bevel > 0:
        mod = obj.modifiers.new("Machined edges", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        mod.harden_normals = True
    return obj


def plate(name, location, size, surface, bevel=0.045, rig="body", taper=1):
    # Width tapers toward the lower face. Keep hard panel breaks.
    x, y, z = (value / 2 for value in size)
    vertices = [
        (-x * taper, -y, -z), (x * taper, -y, -z),
        (x * taper, y, -z), (-x * taper, y, -z),
        (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z),
    ]
    faces = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    return finish(obj, name, surface, bevel, rig)


def joint(name, location, radius, length, surface, axis="x", rig="body"):
    rotation = (0, pi / 2, 0) if axis == "x" else (pi / 2, 0, 0)
    if axis == "z":
        rotation = (0, 0, 0)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12, radius=radius, depth=length, location=location, rotation=rotation
    )
    return finish(bpy.context.object, name, surface, min(0.03, length / 4), rig)


plate("Pelvis frame", (0, 0.05, 1.30), (0.93, 0.60, 0.31), 0)
plate("Tapered chassis", (0, 0.04, 1.91), (1.62, 0.94, 1.10), 0, 0.12, taper=0.53)
plate("Breastplate", (0, -0.40, 2.02), (1.46, 0.27, 0.71), 1, 0.095, taper=0.71)
plate("Optics housing", (0, -0.53, 2.03), (0.44, 0.18, 0.36), 0, 0.07)
joint("Status lamp bezel", (0, -0.64, 2.04), 0.125, 0.07, 1, "y")
joint("Status lamp", (0, -0.68, 2.04), 0.080, 0.045, 2, "y")
joint("Neck swivel", (0, 0, 2.49), 0.21, 0.29, 0, "z")
plate("Helmet shell", (0, 0.00, 2.80), (1.11, 0.88, 0.62), 1, 0.135, "head", 0.86)
plate("Inset faceplate", (0, -0.41, 2.79), (0.99, 0.23, 0.38), 0, 0.062, "head", 0.84)
plate("Scan slit", (0, -0.532, 2.82), (0.78, 0.054, 0.105), 2, 0.022, "head")
plate("Helmet brow", (0, -0.46, 2.94), (1.03, 0.24, 0.15), 1, 0.048, "head")
plate("Antenna", (-0.38, 0.17, 3.18), (0.077, 0.080, 0.29), 0, 0.012, "head").rotation_euler.y = -0.18
plate("Antenna marker", (-0.408, 0.17, 3.34), (0.085, 0.089, 0.06), 2, 0.012, "head")

for side, arm in [(-1, "left"), (1, "right")]:
    x = side * 1.05
    joint("Shoulder bearing", (x, 0.04, 1.89), 0.27, 0.56, 0, rig=arm)
    plate("Ceramic shoulder", (x + side * 0.11, 0.04, 2.02),
          (0.63, 0.81, 0.43), 1, 0.12, arm, 0.82)
    plate("Shoulder signal", (x + side * 0.12, -0.38, 2.05),
          (0.30, 0.042, 0.055), 2, 0.014, arm)
    plate("Upper actuator", (x, 0.055, 1.59), (0.34, 0.38, 0.59), 0, rig=arm)
    joint("Elbow journal", (x, 0.03, 1.31), 0.18, 0.43, 1, rig=arm)
    plate("Forearm shield", (x + side * 0.06, -0.20, 1.06),
          (0.53, 0.63, 0.54), 1, 0.095, arm, 0.82)
    plate("Wrist block", (x, -0.25, 0.75), (0.39, 0.41, 0.27), 0, rig=arm)
    for finger in range(3):
        plate("Gripper jaw", (x + (finger - 1) * 0.115, -0.36, 0.59),
              (0.083, 0.24, 0.17), 1, 0.019, arm)

    leg = side * 0.445
    plate("Leg actuator", (leg, 0.10, 0.88), (0.39, 0.49, 0.82), 0)
    joint("Knee bearing", (leg, -0.11, 0.68), 0.23, 0.45, 0)
    plate("Ceramic knee guard", (leg, -0.31, 0.68),
          (0.46, 0.22, 0.29), 1, 0.066, taper=0.80)
    plate("Shin guard", (leg + side * 0.03, -0.12, 0.39),
          (0.55, 0.57, 0.49), 1, 0.078, taper=1.07)
    plate("Boot tread", (leg + side * 0.03, -0.18, 0.10),
          (0.68, 1.04, 0.20), 0, 0.052)
    plate("Toe cap", (leg + side * 0.03, -0.45, 0.235),
          (0.62, 0.52, 0.18), 1, 0.058, taper=1.03)


def export_model():
    depsgraph = bpy.context.evaluated_depsgraph_get()
    origins = {"head": Vector((0, 0, 2.8)), "left": Vector((-1.05, 0, 1.8)),
               "right": Vector((1.05, 0, 1.8)), "body": Vector((0, 0, 0))}
    groups = {}
    for obj in sorted(bpy.context.scene.objects, key=lambda obj: obj.name):
        rig, surface = obj["rig"], obj["surface"]
        positions, normals, indices, lookup = groups.setdefault(
            (rig, surface), ([], [], [], {})
        )
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        for triangle in mesh.loop_triangles:
            for loop_index in triangle.loops:
                loop = mesh.loops[loop_index]
                p = obj.matrix_world @ mesh.vertices[loop.vertex_index].co - origins[rig]
                n = obj.matrix_world.to_3x3() @ mesh.corner_normals[loop_index].vector
                position = tuple(round(value, 4) for value in (p.x, p.z, p.y))
                normal = tuple(round(value, 3) for value in (n.x, n.z, n.y))
                vertex = position + normal
                if vertex not in lookup:
                    lookup[vertex] = len(positions) // 3
                    positions.extend(vertex[:3])
                    normals.extend(vertex[3:])
                indices.append(lookup[vertex])
        evaluated.to_mesh_clear()
    parts = [
        dict(rig=rig, material=surface, positions=positions, normals=normals, indices=indices)
        for (rig, surface), (positions, normals, indices, _) in sorted(groups.items())
    ]
    target = ROOT / "src" / "world" / "sentinelMesh.json"
    target.write_text("[\n" + ",\n".join(json.dumps(part, separators=(",", ":")) for part in parts) + "\n]\n",
                      encoding="utf-8")
    print(f"Exported {len(parts)} meshes and {sum(len(p['indices']) // 3 for p in parts)} triangles")


if __name__ == "__main__":
    export_model()
