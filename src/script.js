import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { texture } from 'three/examples/jsm/nodes/Nodes.js'

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const rgbeLoader = new RGBELoader()

/**
 * INFO: Textures and color space section
 */

const textureLoader = new THREE.TextureLoader()

/**
 * INFO: Load floor textures
 */

const floorColorTexture = textureLoader.load('/textures/wood_cabinet_worn_long/wood_cabinet_worn_long_diff_1k.jpg')
const floorNormalTexture = textureLoader.load('/textures/wood_cabinet_worn_long/wood_cabinet_worn_long_nor_gl_1k.png')
const floorAORoughnessMetalnessTexture = textureLoader.load('/textures/wood_cabinet_worn_long/wood_cabinet_worn_long_arm_1k.jpg')

floorColorTexture.colorSpace = THREE.SRGBColorSpace
/**
 * INFO: Load wall textures
 */

const wallColorTexture = textureLoader.load('/textures/castle_brick_broken_06/castle_brick_broken_06_diff_1k.jpg')
const wallNormalTexture = textureLoader.load('/textures/castle_brick_broken_06/castle_brick_broken_06_nor_gl_1k.png')
const wallAORoughnessMetalnessTexture = textureLoader.load('/textures/castle_brick_broken_06/castle_brick_broken_06_nor_gl_1k.png')

wallColorTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Base
 */
// Debug
const gui = new GUI()
// const global = ()


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child.isMesh)
        {
            // Activate shadow here
            // INFO: activate all model meshes and shadows. The method tests if each material is a mesh
            child.castShadow = true
            child.receiveShadow = true
        
        
        }
    })
}

/**
 * Environment map
 */
// Intensity
scene.environmentIntensity = 1
gui
    .add(scene, 'environmentIntensity')
    .min(0)
    .max(10)
    .step(0.001)

// HDR (RGBE) equirectangular
rgbeLoader.load('/environmentMaps/0/2k.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})

/**
 * INFO: Directional light - create one for shadows and position it randomly for now
 */

const directionalLight = new THREE.DirectionalLight('#ffffff', 6)
directionalLight.position.set(-4, 6.5, 2.5)
directionalLight.castShadow = true
scene.add(directionalLight)

gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('lightIntensity')
gui.add(directionalLight.position, 'x').min(-10).max(10).step(0.001).name('lightX')
gui.add(directionalLight.position, 'y').min(-10).max(10).step(0.001).name('lightY')
gui.add(directionalLight.position, 'z').min(-10).max(10).step(0.001).name('lightZ')
gui.add(directionalLight, 'castShadow')


/**
 * INFO: CameraHelper - used before using the traverse method and getting the directionalLight best position
 */

// const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(directionalLightCameraHelper)

/**
 * INFO: Target - only adding the target doesn't change anything, because Three.js uses matrices to define an object transforms. when we change props like position, scale, rotation, they will be compiled into a matrix. This process is done ONLY before the object is being rendered and if it's in the scene.
 * Even if the directional light is in the scene, the target is not.
 * Fixes:
 * - add target to scene
 * - update the matrix manually using updateWorldMarix() method
 */

directionalLight.target.position.set(0, 4, 0)
directionalLight.target.updateWorldMatrix()

// The shadow camera helper fits the scene, we can now reduce the far value
directionalLight.shadow.camera.far = 15
// For realistic and precise shadows - we can increse the shadow map size to 1024x1024
directionalLight.shadow.mapSize.set(1024, 1024)

/**
 * INFO: Create the plane mesh using PaneGeometry and MeshStandardMaterial
 */

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({
        map: floorColorTexture,
        normalMap: floorNormalTexture,
        aoMap: floorAORoughnessMetalnessTexture,
        roughnessMap: floorAORoughnessMetalnessTexture,
        metalnessMap: floorAORoughnessMetalnessTexture
    })
)

floor.position.set(0, 0, 0)
floor.rotation.x = - Math.PI * 0.5

scene.add(floor)

/**
 * INFO: Create wall
 */

const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({
        map: wallColorTexture,
        normalMap: wallNormalTexture,
        aoMap: wallAORoughnessMetalnessTexture,
        roughnessMap: wallAORoughnessMetalnessTexture,
        metalnessMap: wallAORoughnessMetalnessTexture
    })
)

wall.position.y = 4
wall.position.z = -4
scene.add(wall)


/**
 * Models
 */
// Helmet
gltfLoader.load(
    '/models/FlightHelmet/glTF/FlightHelmet.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(10, 10, 10)
        scene.add(gltf.scene)

        updateAllMaterials()
    }
)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 5, 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.y = 3.5
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,

    /**
 * INFO: Antialiasing = artifact that might appear in some situatins where we can see a star-like effect (usually on the side of the geometries)
 -> depends on pixel ratio => when it renders the pixel, it tests that geometry is being renderer in the pixel. It calculates the color and, in the end, that color appears on the screen
 Ways to fix:
 - Super Sampling (SSAA) or full screen sampling (FSAA): we increase he resolution beyond the actual one. When resized to its normal-size, each pixel color will automatically be averaged from the 4 pixels rendered. Easy, but bad for performance
 - Multi samplimg (MSAA) - automatically performed by most GPUs. Checks if the neighbours of the pizel is being rendered. If it's the egde of the geometry, will mix its color with those neighbouring colors. Only works on geometry edges.
 -> Only on instantiating
 -> will slightly exhaust resources
 -> screens with a pixel ratio above 1 don't really need antialias
 */

    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * INFO: Tone mapping
 */

renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 2


gui.add(renderer, 'toneMapping', {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping, //washed out colors, but realistic with a poorly set camera
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping
})

gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001)

/**
 * INFO: Shadows
 -> env maps can't cast shadows. We need to add a light that roughly matches the lighting of the environment map and use it to cast shadows
 -> 
 */

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap





/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()