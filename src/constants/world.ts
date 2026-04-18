export const WORLD_W = 2752
export const WORLD_H = 1536

export const TURTLE_SPEED = 14          // px/sec
export const WAYPOINT_MARGIN_X = 550    // 20% of WORLD_W
export const WAYPOINT_MARGIN_Y = 307    // 20% of WORLD_H
export const ARRIVAL_THRESHOLD = 20     // px — close enough to waypoint
export const MAX_TILT = 12              // degrees max banking tilt

export const REST_MIN = 2000            // ms
export const REST_MAX = 6000            // ms
export const SLEEP_MIN = 15000          // ms
export const SLEEP_MAX = 45000          // ms
export const SLEEP_CHANCE = 0.3         // 30% chance of long sleep on arrival

export const CAMERA_LERP = 0.06        // interpolation factor per frame
export const CAMERA_LEAD = 120         // px ahead of turtle to centre the view
