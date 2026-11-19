import { GODOT_FOLDER_STRUCTURE, GODOT_STAGE_DOCS } from './godotScripts';
import { SaveGameData } from './types';
import { createZipBlob, ZipEntryInput } from './zipBuilder';

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const OFFLINE_HTML_PATH = './downloads/KIGO-TamilNadu-OpenWorld.html';

const HOW_TO_PLAY_TXT = `KIGO – THE TAMIL NADU OPEN WORLD (OFFLINE PC / BROWSER EDITION)
==================================================================

HOW TO PLAY OFFLINE:
1. Extract this ZIP folder anywhere on your PC, Mac, or phone.
2. Double-click "KIGO-TamilNadu-OpenWorld.html" to open it in Chrome, Edge, or Firefox.
3. No internet connection, Node.js, or server is required!

CONTROLS:
- WASD          : Move
- Shift         : Sprint
- Space         : Jump
- C             : Crouch
- Mouse / Arrows: Look around (Click screen to lock mouse, Esc to release)
- F             : Talk to Villupuram friends / Open Tea Kada Shop
- E             : Enter or Exit Auto-Rickshaw, TN Bus, Motorcycle, Car, Tractor, Police SUV
- H             : Vehicle Horn
- M             : Open Tamil Nadu Map & Fast Travel (Villupuram, Paddy Fields, Pondicherry, Chennai)
- I / Tab       : Open Food Bag, Tea Shop & Tamil Cultural Outfits
- Esc           : Pause / Save Game (Progress saves locally in your browser)
`;

const GODOT_PROJECT_FILE = `; Engine configuration file.
; It's best edited using the editor UI and not directly,
; since the parameters that go here are not all obvious.
;
; Format:
;   [section] ; section goes between []
;   param=value ; assign values to parameters

config_version=5

[application]

config/name="KIGO - The Tamil Nadu Open World"
run/main_scene="res://scenes/main/main_world.tscn"
config/features=PackedStringArray("4.2", "Forward Plus")

[autoload]

SaveSystem="*res://scripts/systems/save_load_system.gd"

[display]

window/size/viewport_width=1280
window/size/viewport_height=720
window/stretch/mode="canvas_items"

[input]

move_forward={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":87,"key_label":0,"unicode":119,"location":0,"echo":false,"script":null)
]
}
move_back={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":83,"key_label":0,"unicode":115,"location":0,"echo":false,"script":null)
]
}
move_left={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":65,"key_label":0,"unicode":97,"location":0,"echo":false,"script":null)
]
}
move_right={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":68,"key_label":0,"unicode":100,"location":0,"echo":false,"script":null)
]
}
sprint={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194325,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)
]
}
jump={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":32,"key_label":0,"unicode":32,"location":0,"echo":false,"script":null)
]
}
crouch={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":67,"key_label":0,"unicode":99,"location":0,"echo":false,"script":null)
]
}
interact={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":70,"key_label":0,"unicode":102,"location":0,"echo":false,"script":null)
]
}
enter_vehicle={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":69,"key_label":0,"unicode":101,"location":0,"echo":false,"script":null)
]
}
`;

const GODOT_PLAYER_TSCN = `[gd_scene load_steps=6 format=3]

[ext_resource type="Script" path="res://scripts/player/player_controller.gd" id="1_ctrl"]
[ext_resource type="Script" path="res://scripts/player/third_person_camera.gd" id="2_cam"]
[ext_resource type="Script" path="res://scripts/player/character_animator.gd" id="3_anim"]

[sub_resource type="CapsuleShape3D" id="CapsuleShape3D_kigo"]
radius = 0.38
height = 1.78

[sub_resource type="CapsuleMesh" id="CapsuleMesh_placeholder"]
radius = 0.35
height = 1.75

[node name="KigoPlayer" type="CharacterBody3D"]
script = ExtResource("1_ctrl")

[node name="CollisionShape3D" type="CollisionShape3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0.9, 0)
shape = SubResource("CapsuleShape3D_kigo")

[node name="VisualModel" type="Node3D" parent="."]

[node name="PlaceholderMesh" type="MeshInstance3D" parent="VisualModel"]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0.9, 0)
mesh = SubResource("CapsuleMesh_placeholder")

[node name="CharacterAnimator" type="Node" parent="VisualModel"]
script = ExtResource("3_anim")

[node name="CameraPivot" type="Node3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1.55, 0)
script = ExtResource("2_cam")

[node name="SpringArm3D" type="SpringArm3D" parent="CameraPivot"]
spring_length = 4.2

[node name="Camera3D" type="Camera3D" parent="CameraPivot/SpringArm3D"]
fov = 62.0
`;

const GODOT_MAIN_WORLD_TSCN = `[gd_scene load_steps=7 format=3]

[ext_resource type="Script" path="res://scripts/systems/villupuram_world.gd" id="1_world"]
[ext_resource type="Script" path="res://scripts/systems/mission_manager.gd" id="2_mission"]
[ext_resource type="PackedScene" path="res://scenes/player/kigo_player.tscn" id="3_player"]

[sub_resource type="ProceduralSkyMaterial" id="ProceduralSkyMaterial_tn"]
sky_top_color = Color(0.24, 0.56, 0.88, 1)
sky_horizon_color = Color(0.84, 0.88, 0.92, 1)

[sub_resource type="Sky" id="Sky_tn"]
sky_material = SubResource("ProceduralSkyMaterial_tn")

[sub_resource type="Environment" id="Environment_tn"]
background_mode = 2
sky = SubResource("Sky_tn")
tonemap_mode = 2

[sub_resource type="BoxMesh" id="BoxMesh_ground"]
size = Vector3(240, 1, 240)

[sub_resource type="BoxShape3D" id="BoxShape3D_ground"]
size = Vector3(240, 1, 240)

[node name="MainWorld" type="Node3D"]
script = ExtResource("1_world")
player_path = NodePath("KigoPlayer")

[node name="WorldEnvironment" type="WorldEnvironment" parent="."]
environment = SubResource("Environment_tn")

[node name="DirectionalLight3D" type="DirectionalLight3D" parent="."]
transform = Transform3D(0.866, -0.353, 0.353, 0, 0.707, 0.707, -0.5, -0.612, 0.612, 0, 24, 0)
shadow_enabled = true

[node name="VillupuramGround" type="StaticBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, -0.5, 0)

[node name="GroundMesh" type="MeshInstance3D" parent="VillupuramGround"]
mesh = SubResource("BoxMesh_ground")

[node name="GroundCollision" type="CollisionShape3D" parent="VillupuramGround"]
shape = SubResource("BoxShape3D_ground")

[node name="Region_Villupuram" type="Node3D" parent="."]

[node name="Region_Pondicherry" type="Node3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 160, 0, 0)

[node name="Region_Chennai" type="Node3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, -160)

[node name="KigoPlayer" parent="." instance=ExtResource("3_player")]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0.2, 0)

[node name="MissionManager" type="Node" parent="."]
script = ExtResource("2_mission")
`;

export function downloadGodotProjectZip(): void {
  const entries: ZipEntryInput[] = [
    {
      name: 'KIGO-TamilNadu-Godot4/project.godot',
      content: GODOT_PROJECT_FILE,
    },
    {
      name: 'KIGO-TamilNadu-Godot4/scenes/main/main_world.tscn',
      content: GODOT_MAIN_WORLD_TSCN,
    },
    {
      name: 'KIGO-TamilNadu-Godot4/scenes/player/kigo_player.tscn',
      content: GODOT_PLAYER_TSCN,
    },
    {
      name: 'KIGO-TamilNadu-Godot4/README_GODOT4_SETUP.txt',
      content: `KIGO – THE TAMIL NADU OPEN WORLD (GODOT 4 PROJECT)
==================================================

1. Open Godot 4.2+ (Forward+ or Compatibility renderer).
2. Click "Import" and select "project.godot" inside this folder.
3. Press F5 to run the starter Villupuram playable scene with WASD + Sprint + Crouch + Jump + Third-Person Camera.
4. Replace VisualModel/PlaceholderMesh with your Ready Player Me or Mixamo GLB humanoid rig and attach an AnimationTree.

FOLDER STRUCTURE:
${GODOT_FOLDER_STRUCTURE}
`,
    },
  ];

  for (const doc of GODOT_STAGE_DOCS) {
    const cleanRelPath = doc.filePath.replace(/^res:\/\//, '');
    entries.push({
      name: `KIGO-TamilNadu-Godot4/${cleanRelPath}`,
      content: doc.code,
    });
  }

  const blob = createZipBlob(entries);
  triggerBlobDownload(blob, 'KIGO-TamilNadu-Godot4-Project.zip');
}

async function fetchOfflineHtmlText(): Promise<string> {
  // If user is already running from a local file:// standalone HTML copy, serialize current document safely
  if (window.location.protocol === 'file:') {
    throw new Error('ALREADY_OFFLINE');
  }
  const res = await fetch(OFFLINE_HTML_PATH, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text.includes('<!doctype html') && !text.includes('<!DOCTYPE html')) {
    throw new Error('Offline bundle not generated yet');
  }
  return text;
}

export async function downloadOfflineHtmlGame(): Promise<void> {
  const html = await fetchOfflineHtmlText();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerBlobDownload(blob, 'KIGO-TamilNadu-OpenWorld.html');
}

export async function downloadOfflinePcZip(): Promise<void> {
  const html = await fetchOfflineHtmlText();
  const blob = createZipBlob([
    {
      name: 'KIGO-TamilNadu-OpenWorld-PC/KIGO-TamilNadu-OpenWorld.html',
      content: html,
    },
    {
      name: 'KIGO-TamilNadu-OpenWorld-PC/HOW_TO_PLAY.txt',
      content: HOW_TO_PLAY_TXT,
    },
  ]);
  triggerBlobDownload(blob, 'KIGO-TamilNadu-OpenWorld-PC.zip');
}

export function downloadSaveFile(saveData: SaveGameData): void {
  const blob = new Blob([JSON.stringify(saveData, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerBlobDownload(blob, 'kigo-tamilnadu-save.json');
}
