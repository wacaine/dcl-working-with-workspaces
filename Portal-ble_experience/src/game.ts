import { DummyEnt, Portal, PortalColor } from './portal'
import { Card } from './card'
import { Gun } from './gun'
import { Sound } from './sound'
import * as utils from '@dcl/ecs-scene-utils'
import { movePlayerTo } from '@decentraland/RestrictedActions'

const SCENE_NAME = "Portal-ble_experience"
// Sounds
const teleportSound = new Sound(new AudioClip('sounds/teleport.mp3'))
const portalSuccessSound = new Sound(new AudioClip('sounds/portalSuccess.mp3'))
const portalFailSound = new Sound(new AudioClip('sounds/portalFail.mp3'))

// Portals
const portalOrange = new Portal(new GLTFShape('models/portalOrange.glb'))
const portalBlue = new Portal(new GLTFShape('models/portalBlue.glb'))
const DELAY_TIME = 3000 // In milliseconds
const RESET_SIZE = 2 // In meters

const triggerBox = new utils.TriggerBoxShape(
  new Vector3(RESET_SIZE, RESET_SIZE, RESET_SIZE),
  Vector3.Zero()
)

portalBlue.addComponent(
  new utils.TriggerComponent(triggerBox, {
    onCameraEnter: () => {
      if (portalOrange.hasComponent(Transform)) {
        teleportSound.getComponent(AudioSource).playOnce()
        movePlayerTo(
          portalOrange.getComponent(Transform).position,
          portalOrange.cameraTarget
        ).catch((error) => log(error))
        triggerBox.size.setAll(0) // Resize the trigger so that the player doesn't port in and out constantly
        portalOrange.addComponentOrReplace(
          new utils.Delay(DELAY_TIME, () => {
            triggerBox.size.setAll(RESET_SIZE)
          })
        ) // Reset the trigger after 1.5 seconds
        portalBlue.addComponentOrReplace(
          new utils.Delay(DELAY_TIME, () => {
            triggerBox.size.setAll(RESET_SIZE)
          })
        )
      }
    }
  })
)
portalOrange.addComponent(
  new utils.TriggerComponent(triggerBox, {
    onCameraEnter: () => {
      if (portalBlue.hasComponent(Transform)) {
        teleportSound.getComponent(AudioSource).playOnce()
        movePlayerTo(
          portalBlue.getComponent(Transform).position,
          portalBlue.cameraTarget
        ).catch((error) => log(error))
        triggerBox.size.setAll(0)
        portalOrange.addComponentOrReplace(
          new utils.Delay(DELAY_TIME, () => {
            triggerBox.size.setAll(RESET_SIZE)
          })
        )
        portalBlue.addComponentOrReplace(
          new utils.Delay(DELAY_TIME, () => {
            triggerBox.size.setAll(RESET_SIZE)
          })
        )
      }
    }
  })
)

// Controls
const input = Input.instance
let activePortal = PortalColor.Blue

input.subscribe('BUTTON_DOWN', ActionButton.POINTER, true, async (event) => {
  log(SCENE_NAME,"input down","gun.hasGun",gun.hasGun)
  if (gun.hasGun) {
    if (!event.hit) return
    //if (event.hit.meshName.match('lightWall_collider')) {
    // Only allow portals to appear on light walls
    if (event.hit.entityId !== '' && event.hit.length < 40) {
      const offset = Vector3.Normalize(
        Camera.instance.position.clone().subtract(event.hit.hitPoint.clone())
      ).scale(0.1)

      const finalPosition = event.hit.hitPoint.add(offset)

      const dummy = new DummyEnt(finalPosition, event.hit.normal)

      portalSuccessSound.getComponent(AudioSource).playOnce()

      if (activePortal === PortalColor.Blue) {
        portalBlue.spawn(
          dummy.getComponent(Transform).position,
          dummy.getComponent(Transform).rotation,
          dummy.cameraTarget
        )
        const transform = portalBlue.getComponent(Transform)
      } else {
        portalOrange.spawn(
          dummy.getComponent(Transform).position,
          dummy.getComponent(Transform).rotation,
          dummy.cameraTarget
        )

        const transform = portalOrange.getComponent(Transform)
      }
    } else {
      portalFailSound.getComponent(AudioSource).playOnce()
    }
  }
})

// Swap between portal colors when pressing the E key
input.subscribe('BUTTON_DOWN', ActionButton.PRIMARY, false, (): void => {
  log(SCENE_NAME,"input down","activePortal",activePortal)
  if (activePortal === PortalColor.Blue) {
    activePortal = PortalColor.Orange
    gunBlueGlow.getComponent(Transform).scale.setAll(0)
    gunOrangeGlow.getComponent(Transform).scale.setAll(1)
  } else {
    activePortal = PortalColor.Blue
    gunBlueGlow.getComponent(Transform).scale.setAll(1)
    gunOrangeGlow.getComponent(Transform).scale.setAll(0)
  }
})

const hasGun: boolean = false
const hasKey: boolean = false

// Gun
const gunBlueGlow = new Entity()
gunBlueGlow.addComponent(new Transform())
gunBlueGlow.addComponent(new GLTFShape('models/portalGunBlueGlow.glb'))
const gunOrangeGlow = new Entity()
gunOrangeGlow.addComponent(new Transform())
gunOrangeGlow.addComponent(new GLTFShape('models/portalGunOrangeGlow.glb'))
gunOrangeGlow.getComponent(Transform).scale.setAll(0) // Hide orange glow

const gun = new Gun(
  new GLTFShape('models/portalGun.glb'),
  new Transform({ position: new Vector3(-8, 1.5, 4.5) }),
  gunBlueGlow,
  gunOrangeGlow
)

//gun.pickUp()

// utils.addTestCube(
//   { position: new Vector3(8, 1, 8), scale: new Vector3(4, 4, 4) },
//   () => {}
// )
