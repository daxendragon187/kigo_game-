export interface GodotStageDoc {
  stage: number;
  title: string;
  filePath: string;
  sceneHierarchy: string;
  setupSteps: string;
  code: string;
}

export const GODOT_FOLDER_STRUCTURE = `res://
├── project.godot
├── scenes/
│   ├── main/
│   │   └── main_world.tscn
│   ├── player/
│   │   └── kigo_player.tscn
│   ├── npcs/
│   │   ├── friend_npc.tscn
│   │   └── pedestrian_npc.tscn
│   ├── vehicles/
│   │   ├── auto_rickshaw.tscn
│   │   ├── tn_bus.tscn
│   │   └── motorcycle.tscn
│   ├── world/
│   │   ├── villupuram_region.tscn
│   │   ├── pondicherry_coast.tscn
│   │   └── chennai_metro.tscn
│   └── ui/
│       ├── game_hud.tscn
│       └── dialogue_box.tscn
├── scripts/
│   ├── player/
│   │   ├── player_controller.gd
│   │   ├── third_person_camera.gd
│   │   └── character_animator.gd
│   ├── vehicles/
│   │   └── indian_vehicle.gd
│   ├── npcs/
│   │   └── npc_pedestrian_ai.gd
│   └── systems/
│       ├── villupuram_world.gd
│       ├── dialogue_manager.gd
│       ├── mission_manager.gd
│       ├── weather_time_system.gd
│       └── save_load_system.gd
├── resources/
│   └── missions/
│       └── ch1_villupuram_dawn.tres
└── assets/
    ├── characters/ (GLB/GLTF from Ready Player Me / Mixamo)
    ├── animations/ (Idle, Walk, Run, Jump, Sit, Swim)
    ├── vehicles/
    └── audio/`;

export const GODOT_STAGE_DOCS: GodotStageDoc[] = [
  {
    stage: 1,
    title: 'Player Controller (Stage 1)',
    filePath: 'res://scripts/player/player_controller.gd',
    sceneHierarchy: `CharacterBody3D (KigoPlayer)
├── CollisionShape3D (CapsuleShape3D: radius=0.38, height=1.78)
├── VisualModel (Node3D -> Imported GLB Humanoid Rig)
│   └── AnimationTree (StateMachine: Idle / Walk / Run / Jump)
├── CameraPivot (Node3D, Y=1.55) -> third_person_camera.gd
│   └── SpringArm3D (spring_length=4.2, collision_mask=1)
│       └── Camera3D (fov=62)
└── InteractionRay (RayCast3D)`,
    setupSteps:
      '1. Import your GLB human character (Ready Player Me / Mixamo FBX->GLB via Blender) into res://assets/characters/.\n2. In Project -> Project Settings -> Input Map, add: move_forward (W), move_back (S), move_left (A), move_right (D), sprint (Shift), jump (Space), crouch (C), interact (F), enter_vehicle (E).\n3. Attach player_controller.gd to CharacterBody3D and third_person_camera.gd to CameraPivot.',
    code: `extends CharacterBody3D
class_name PlayerController

signal stamina_changed(current: float, max_val: float)

@export var walk_speed: float = 4.6
@export var run_speed: float = 8.8
@export var crouch_speed: float = 2.6
@export var jump_velocity: float = 6.2
@export var rotation_speed: float = 10.0

@onready var visual_model: Node3D = $VisualModel
@onready var camera_pivot: Node3D = $CameraPivot
@onready var anim_controller: CharacterAnimator = $VisualModel/CharacterAnimator

var stamina: float = 100.0
var is_crouching: bool = false
var is_swimming: bool = false
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

func _physics_process(delta: float) -> void:
\tif not is_on_floor() and not is_swimming:
\t\tvelocity.y -= gravity * delta

\tif Input.is_action_just_pressed("crouch"):
\t\tis_crouching = not is_crouching

\tif Input.is_action_just_pressed("jump") and is_on_floor() and not is_swimming:
\t\tvelocity.y = jump_velocity
\t\tis_crouching = false

\tvar input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
\tvar cam_basis: Basis = Basis(Vector3.UP, camera_pivot.rotation.y)
\tvar move_dir: Vector3 = (cam_basis * Vector3(input_dir.x, 0.0, input_dir.y)).normalized()

\tvar sprinting: bool = Input.is_action_pressed("sprint") and move_dir.length() > 0.1 and stamina > 1.0 and not is_crouching
\tif sprinting:
\t\tstamina = max(0.0, stamina - 16.0 * delta)
\telse:
\t\tstamina = min(100.0, stamina + 14.0 * delta)
\temit_signal("stamina_changed", stamina, 100.0)

\tvar target_speed: float = crouch_speed if is_crouching else (run_speed if sprinting else walk_speed)
\tif move_dir.length() > 0.05:
\t\tvelocity.x = move_toward(velocity.x, move_dir.x * target_speed, 28.0 * delta)
\t\tvelocity.z = move_toward(velocity.z, move_dir.z * target_speed, 28.0 * delta)
\t\tvar target_angle := atan2(move_dir.x, move_dir.z)
\t\tvisual_model.rotation.y = lerp_angle(visual_model.rotation.y, target_angle, rotation_speed * delta)
\telse:
\t\tvelocity.x = move_toward(velocity.x, 0.0, 24.0 * delta)
\t\tvelocity.z = move_toward(velocity.z, 0.0, 24.0 * delta)

\tmove_and_slide()
\tif anim_controller:
\t\tanim_controller.update_locomotion(Vector2(velocity.x, velocity.z).length(), not is_on_floor(), is_crouching)`,
  },
  {
    stage: 1,
    title: 'Third-Person Camera (Stage 1)',
    filePath: 'res://scripts/player/third_person_camera.gd',
    sceneHierarchy: `CameraPivot (Node3D)
└── SpringArm3D
    └── Camera3D`,
    setupSteps:
      'Set SpringArm3D shape to SphereShape3D (radius 0.25) so the camera never clips inside Villupuram buildings.',
    code: `extends Node3D
class_name ThirdPersonCamera

@export var mouse_sensitivity: float = 0.0024
@export var min_pitch_deg: float = -42.0
@export var max_pitch_deg: float = 65.0
@export var smooth_follow: float = 14.0

@onready var spring_arm: SpringArm3D = $SpringArm3D
var pitch: float = -0.25

func _ready() -> void:
\tInput.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
\tif event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
\t\trotate_y(-event.relative.x * mouse_sensitivity)
\t\tpitch = clamp(pitch - event.relative.y * mouse_sensitivity, deg_to_rad(min_pitch_deg), deg_to_rad(max_pitch_deg))
\t\tspring_arm.rotation.x = pitch
\tif Input.is_action_just_pressed("ui_cancel"):
\t\tInput.mouse_mode = Input.MOUSE_MODE_VISIBLE if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED`,
  },
  {
    stage: 1,
    title: 'Character Animator (Stage 1)',
    filePath: 'res://scripts/player/character_animator.gd',
    sceneHierarchy: `VisualModel (Node3D)
├── Skeleton3D
├── AnimationPlayer
└── AnimationTree (BlendSpace1D: Idle -> Walk -> Run)`,
    setupSteps:
      'In AnimationTree, create a BlendSpace1D named "locomotion" with points 0.0 (Idle), 4.6 (Walk), 8.8 (Run) and link parameters/locomotion/blend_position.',
    code: `extends Node
class_name CharacterAnimator

@onready var anim_tree: AnimationTree = get_parent().get_node_or_null("AnimationTree")

func _ready() -> void:
\tif anim_tree:
\t\tanim_tree.active = true

func update_locomotion(horizontal_speed: float, in_air: bool, crouching: bool) -> void:
\tif anim_tree == null:
\t\treturn
\tanim_tree.set("parameters/locomotion/blend_position", horizontal_speed)
\tanim_tree.set("parameters/conditions/in_air", in_air)
\tanim_tree.set("parameters/conditions/crouching", crouching)`,
  },
  {
    stage: 2,
    title: 'Villupuram World & Streaming (Stage 2 & 7)',
    filePath: 'res://scripts/systems/villupuram_world.gd',
    sceneHierarchy: `MainWorld (Node3D)
├── WorldEnvironment
├── DirectionalLight3D (Sun)
├── Region_Villupuram (Node3D)
├── Region_Pondicherry (Node3D)
└── Region_Chennai (Node3D)`,
    setupSteps:
      'Uses distance-based region streaming so Villupuram, Pondicherry, and Chennai stay smooth on mid-range PCs.',
    code: `extends Node3D
class_name VillupuramWorld

@export var player_path: NodePath
@export var stream_distance: float = 350.0
@onready var player: Node3D = get_node_or_null(player_path)

var region_nodes: Dictionary = {}

func _ready() -> void:
\tregion_nodes = {
\t\t"villupuram": get_node_or_null("Region_Villupuram"),
\t\t"pondicherry": get_node_or_null("Region_Pondicherry"),
\t\t"chennai": get_node_or_null("Region_Chennai"),
\t}

func _process(_delta: float) -> void:
\tif player == null:
\t\treturn
\tfor r_name in region_nodes.keys():
\t\tvar node: Node3D = region_nodes[r_name]
\t\tif node:
\t\t\tvar dist := player.global_position.distance_to(node.global_position)
\t\t\tnode.visible = dist < stream_distance`,
  },
  {
    stage: 3,
    title: 'Indian Vehicles & NPCs (Stage 3)',
    filePath: 'res://scripts/vehicles/indian_vehicle.gd',
    sceneHierarchy: `VehicleBody3D (AutoRickshaw / TNBus / Motorcycle)
├── ChassisMesh
├── CollisionShape3D
├── VehicleWheel3D (x3 or x4)
├── DriverSeat (Marker3D)
└── AudioStreamPlayer3D (Horn)`,
    setupSteps:
      'Configure VehicleWheel3D use_as_traction on rear wheels and use_as_steering on front wheels.',
    code: `extends VehicleBody3D
class_name IndianVehicle

@export var max_engine_force: float = 1800.0
@export var max_steer_angle: float = 0.45
@export var vehicle_label: String = "Auto-Rickshaw"

var occupied_by_player: bool = false

func _physics_process(_delta: float) -> void:
\tif not occupied_by_player:
\t\tengine_force = 0.0
\t\tbrake = 25.0
\t\treturn

\tvar throttle := Input.get_axis("move_back", "move_forward")
\tvar steer_input := Input.get_axis("move_right", "move_left")
\tengine_force = throttle * max_engine_force
\tsteering = move_toward(steering, steer_input * max_steer_angle, 0.08)
\tbrake = 40.0 if Input.is_action_pressed("jump") else 0.0`,
  },
  {
    stage: 4,
    title: 'Friends Dialogue & Missions (Stage 4 & 5)',
    filePath: 'res://scripts/systems/mission_manager.gd',
    sceneHierarchy: `MissionManager (Node)
└── WaypointBeacon (MeshInstance3D)`,
    setupSteps:
      'Connect mission_updated to the HUD objective label and trigger dialogues in Tamil + English.',
    code: `extends Node
class_name MissionManager

signal mission_started(title: String, objective: String)
signal mission_completed(title: String, reward: int)

var active_chapter: int = 1
var completed_chapters: Array[int] = []

const STORY := {
\t1: { "title": "Villupuram Dawn", "objective": "Meet Meera at Villupuram Railway Station", "reward": 250 },
\t2: { "title": "Shadows at the Bus Stand", "objective": "Investigate Villupuram Market", "reward": 400 },
\t3: { "title": "Pondicherry Coastal Clues", "objective": "Meet Ananya at Promenade Beach", "reward": 600 },
\t4: { "title": "The Highway Confrontation", "objective": "Talk to Selva at the Temple Crossroad", "reward": 850 },
\t5: { "title": "Chennai Reunion", "objective": "Expose the syndicate in Chennai", "reward": 1500 },
}

func start_chapter(chapter: int) -> void:
\tactive_chapter = chapter
\tvar data: Dictionary = STORY.get(chapter, {})
\tif not data.is_empty():
\t\temit_signal("mission_started", data["title"], data["objective"])

func complete_current() -> void:
\tvar data: Dictionary = STORY.get(active_chapter, {})
\tif data.is_empty() or completed_chapters.has(active_chapter):
\t\treturn
\tcompleted_chapters.append(active_chapter)
\temit_signal("mission_completed", data["title"], data["reward"])
\tif STORY.has(active_chapter + 1):
\t\tstart_chapter(active_chapter + 1)`,
  },
  {
    stage: 8,
    title: 'Weather, Time & Save/Load (Stage 8 & 9)',
    filePath: 'res://scripts/systems/save_load_system.gd',
    sceneHierarchy: `SaveSystem (Autoload Singleton)`,
    setupSteps:
      'Register save_load_system.gd as an Autoload in Project Settings -> Autoload.',
    code: `extends Node
class_name SaveLoadSystem

const SAVE_PATH := "user://kigo_tamilnadu_save.json"

func save_game(player_pos: Vector3, chapter: int, money: int) -> void:
\tvar payload := {
\t\t"x": player_pos.x,
\t\t"y": player_pos.y,
\t\t"z": player_pos.z,
\t\t"chapter": chapter,
\t\t"money": money,
\t}
\tvar file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
\tif file:
\t\tfile.store_string(JSON.stringify(payload))

func load_game() -> Dictionary:
\tif not FileAccess.file_exists(SAVE_PATH):
\t\treturn {}
\tvar file := FileAccess.open(SAVE_PATH, FileAccess.READ)
\tvar parsed = JSON.parse_string(file.get_as_text())
\treturn parsed if parsed is Dictionary else {}`,
  },
];
