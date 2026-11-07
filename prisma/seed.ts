import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'

const prisma = new PrismaClient()
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads'
const SIZES = [640, 1280, 1920]

/**
 * Placeholder photography from Unsplash (Unsplash License — free for commercial use,
 * attribution appreciated but not required). Replace with the studio's own project
 * photography before production; see README.
 */
const PHOTO = {
  houseDusk: '1600585154340-be6161a56a0c',
  openLiving: '1600607687939-ce8a6c25118c',
  warmLiving: '1618221195710-dd6b41faaea6',
  galleryLiving: '1600210492486-724fe5c67fb0',
  doubleHeight: '1600566753086-00f18fb6b3ea',
  glassCorridor: '1497366754035-f200968a6e72',
  darkRestaurant: '1517248135467-4c7edcad34c4',
  warmRestaurant: '1552566626-52f8b828add9',
  timberBedroom: '1582719478250-c89cae4dc85b',
  classicBedroom: '1590490360182-c33d57733427',
  darkBedroom: '1616594039964-ae9021a400a0',
  kitchen: '1600489000022-c2086d79f9d4',
  cafeRoom: '1554118811-1e0d58224f24',
  coffeeBar: '1521017432531-fbd92d768814',
  officeWindow: '1497215728101-856f4ea42174',
  officeLounge: '1524758631624-e2822e304c36',
  meetingRoom: '1497366811353-6870744d04b2',
  bathroom: '1584622650111-993a426fbf0a',
  kitchenIsland: '1600585152220-90363fe7e115',
  bedroomDeck: '1600573472591-ee6b68d14c68',
  bedroomDark: '1617104678098-de229db51175',
  livingShutters: '1616137466211-f939a420be84',
  shelfDetail: '1594026112284-02bb6f3352fe',
}

type PhotoKey = keyof typeof PHOTO

const PROJECTS: {
  title: string
  slug: string
  summary: string
  description: string
  category: 'RESIDENTIAL' | 'COMMERCIAL' | 'HOSPITALITY' | 'OTHER'
  location: string
  year: number
  areaM2: number
  client: string
  featured: boolean
  images: { key: PhotoKey; alt: string }[]
}[] = [
  {
    title: 'The Starlake Residence',
    slug: 'the-starlake-residence',
    summary: 'A lakeside family house where every principal room faces the water and the evening light.',
    description: `## A house arranged around the horizon

The site falls two metres from the road to the lake, so the plan steps with it: entry and service at the top, living spaces on the middle terrace, and a long, low pavilion at the water.

The material palette is deliberately narrow — pale oak, honed limestone, lime plaster and blackened steel — so the changing light does most of the work.

### What we did

- Removed the original compartmentalised ground floor and opened the lake elevation to fourteen metres of glass
- Added a cantilevered terrace that shades the living room through the afternoon
- Rebuilt the stair as a solid oak spine that also carries the library

Completed in fourteen months, with the family living on site from month nine.`,
    category: 'RESIDENTIAL',
    location: 'Kuala Lumpur',
    year: 2025,
    areaM2: 720,
    client: 'Private',
    featured: true,
    images: [
      { key: 'houseDusk', alt: 'The Starlake Residence at dusk, lit interiors seen through full-height glazing' },
      { key: 'openLiving', alt: 'Open living room with pale oak joinery and a long kitchen island' },
      { key: 'doubleHeight', alt: 'Double-height living space with an oak stair and galleried landing' },
      { key: 'kitchenIsland', alt: 'Kitchen with a stone island, oak cabinetry and pendant lights' },
      { key: 'livingShutters', alt: 'Living room with deep window reveals and linen sofas' },
      { key: 'bedroomDeck', alt: 'Principal bedroom opening onto the lakeside deck' },
      { key: 'shelfDetail', alt: 'Oak shelving detail with ceramics and framed artwork' },
      { key: 'bedroomDark', alt: 'Guest bedroom in dark timber with layered lighting' },
    ],
  },
  {
    title: 'Villa Serena',
    slug: 'villa-serena',
    summary: 'A hillside villa in Bali, planned as a sequence of shaded rooms around a central water court.',
    description: `## Rooms that open to the garden

The villa is arranged as four pavilions around a reflecting pool, connected by covered walkways. Nothing is more than twelve metres from water or planting.

Local materials were sourced within forty kilometres: coconut timber, paras stone and lime render, with brass detailing left to patinate.

### Details

- Deep roof overhangs calibrated to the wet-season sun angle
- Cross-ventilation throughout, so air-conditioning is used only in the bedrooms
- All furniture made by a single workshop in Ubud

The house is designed to feel three degrees cooler than the garden without mechanical cooling.`,
    category: 'RESIDENTIAL',
    location: 'Ubud, Bali',
    year: 2024,
    areaM2: 540,
    client: 'Private',
    featured: true,
    images: [
      { key: 'warmLiving', alt: 'Warm-toned living pavilion with a linen sofa and timber ceiling' },
      { key: 'timberBedroom', alt: 'Principal bedroom with timber flooring and doors to the garden' },
      { key: 'darkBedroom', alt: 'Guest suite with dark joinery and low evening lighting' },
    ],
  },
  {
    title: 'Maison Noir',
    slug: 'maison-noir',
    summary: 'A forty-seat restaurant in a former shophouse, built around a single open kitchen and a black steel stair.',
    description: `## Dinner, from the first step

The brief was a restaurant that reads as a private dining room. We kept the original shophouse shell, painted everything a deep warm black, and let the kitchen be the only bright element in the room.

Lighting sits at 2200K and dims in three zones through service, so the room moves from aperitif to digestif without anyone noticing the change.

### Scope

- Full interior architecture, kitchen coordination and lighting design
- Custom banquettes in vegetable-tanned leather
- Acoustic ceiling in blackened timber to keep conversation at the table

Opened in March 2025 and fully booked for its first eleven weeks.`,
    category: 'HOSPITALITY',
    location: 'Ho Chi Minh City',
    year: 2025,
    areaM2: 310,
    client: 'Maison Noir',
    featured: true,
    images: [
      { key: 'darkRestaurant', alt: 'Maison Noir dining room with dark walls and low pendant lighting' },
      { key: 'warmRestaurant', alt: 'Bar and banquette seating in leather and dark timber' },
      { key: 'classicBedroom', alt: 'Private dining room with drapes and a long table' },
    ],
  },
  {
    title: 'The Glasshouse Café',
    slug: 'the-glasshouse-cafe',
    summary: 'A day-to-night café and roastery in a converted warehouse, with a nine-metre communal table.',
    description: `## One room, two moods

By day the space is a roastery and café: bright, plant-filled, with the roasting drum visible from every seat. After six it dims into a wine bar.

A single nine-metre oak table runs the length of the room and does the work of a dozen smaller ones — it is where people meet.

### What we built

- Full-height steel-framed glazing reinstated on the north wall
- Roastery enclosed in fluted glass, so the process is visible but the noise is not
- Reclaimed terracotta floor, sealed and left to wear

The fit-out took eleven weeks from demolition to first service.`,
    category: 'COMMERCIAL',
    location: 'Kuala Lumpur',
    year: 2023,
    areaM2: 240,
    client: 'Glasshouse Coffee',
    featured: false,
    images: [
      { key: 'cafeRoom', alt: 'Café interior with planting, timber tables and pendant lights' },
      { key: 'coffeeBar', alt: 'Coffee bar with brass fittings and a long counter' },
      { key: 'kitchen', alt: 'Open preparation kitchen behind the bar' },
    ],
  },
  {
    title: 'Atelier North',
    slug: 'atelier-north',
    summary: 'A design studio fit-out that trades private offices for one long, daylit workroom.',
    description: `## Fewer rooms, better rooms

The client asked for a studio that would make people want to come in. We removed eight private offices and replaced them with one forty-two metre workroom along the glazed facade, plus four small rooms for calls and focus.

Acoustics were the real design problem: a felt ceiling runs the length of the room, and every desk sits within four metres of a window.

### Scope

- Space planning, joinery and lighting
- Meeting rooms in glass and blackened steel
- Library and material archive at the entry

Delivered in nine weeks, with the studio occupied throughout.`,
    category: 'COMMERCIAL',
    location: 'Petaling Jaya',
    year: 2024,
    areaM2: 680,
    client: 'Atelier North',
    featured: false,
    images: [
      { key: 'officeWindow', alt: 'Workroom desks along a full-height window with a city view' },
      { key: 'officeLounge', alt: 'Breakout lounge with soft seating and a floor lamp' },
      { key: 'meetingRoom', alt: 'Glass meeting room with a long table and black frames' },
    ],
  },
  {
    title: 'Northshore Residences',
    slug: 'northshore-residences',
    summary: 'A serviced-residence lobby and lounge that behaves like a garden pavilion rather than a hotel front desk.',
    description: `## Arrival without a counter

Most residence lobbies are built around a desk. We removed it. Residents check in on a tablet at the concierge table, and the centre of the room is given over to a four-metre ficus and a long stone bench.

The palette is limestone, rattan and brushed brass — cool underfoot, warm at eye level.

### Details

- Deep timber brise-soleil to control the west glare
- Seating in six separate groups so conversation stays possible
- Reading room and co-working lounge on the mezzanine

Completed for the eighty-four serviced apartments above.`,
    category: 'HOSPITALITY',
    location: 'Penang',
    year: 2023,
    areaM2: 420,
    client: 'Northshore Living',
    featured: false,
    images: [
      { key: 'galleryLiving', alt: 'Lobby lounge with a gallery wall and layered seating' },
      { key: 'glassCorridor', alt: 'Corridor of glass partitions leading to the reading room' },
      { key: 'bathroom', alt: 'Guest bathroom in stone with a frameless glass shower' },
    ],
  },
]

async function fetchPhoto(id: string): Promise<Buffer> {
  const url = `https://images.unsplash.com/photo-${id}?w=2400&q=85&auto=format&fit=crop`
  const res = await fetch(url, { headers: { 'user-agent': 'quin-web-seed/1.0' } })
  if (!res.ok) throw new Error(`photo ${id}: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function fallbackSvg(w: number, h: number) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3a342c"/><stop offset="100%" stop-color="#121110"/>
      </linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>
    </svg>`,
  )
}

async function writeVariants(projectId: string, buf: Buffer) {
  const meta = await sharp(buf).metadata()
  const width = meta.width ?? 1600
  const height = meta.height ?? 1067
  const fileKey = path.posix.join(projectId, randomBytes(10).toString('hex'))
  await mkdir(path.join(UPLOAD_DIR, projectId), { recursive: true })

  for (const size of SIZES) {
    await sharp(buf, { failOn: 'none' })
      .rotate()
      .resize({ width: Math.min(size, width), withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toFile(path.join(UPLOAD_DIR, `${fileKey}@${size}.webp`))
  }
  return { fileKey, width, height }
}

async function main() {
  const force = process.argv.includes('--force')
  const existing = await prisma.project.count()

  if (existing > 0 && !force) {
    console.log(`Seed skipped — ${existing} projects exist (use --force to replace).`)
    return
  }

  if (force && existing > 0) {
    console.log(`Removing ${existing} existing projects and their images…`)
    const images = await prisma.projectImage.findMany({ select: { fileKey: true, projectId: true } })
    const dirs = new Set(images.map((i) => i.projectId))
    await prisma.projectImage.deleteMany({})
    await prisma.slugHistory.deleteMany({})
    await prisma.project.deleteMany({})
    for (const dir of dirs) await rm(path.join(UPLOAD_DIR, dir), { recursive: true, force: true })
  }

  for (const [i, p] of PROJECTS.entries()) {
    const project = await prisma.project.create({
      data: {
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        description: p.description,
        category: p.category,
        location: p.location,
        year: p.year,
        areaM2: p.areaM2,
        client: p.client,
        status: 'PUBLISHED',
        featured: p.featured,
        sortOrder: (i + 1) * 10,
        publishedAt: new Date(Date.now() - i * 86400000),
      },
    })

    let coverId: string | null = null
    for (const [g, img] of p.images.entries()) {
      let buf: Buffer
      try {
        buf = await fetchPhoto(PHOTO[img.key])
      } catch (err) {
        console.warn(`  photo failed (${img.key}), using gradient:`, (err as Error).message)
        buf = fallbackSvg(2000, 1333)
      }
      const v = await writeVariants(project.id, buf)
      const row = await prisma.projectImage.create({
        data: {
          projectId: project.id,
          fileKey: v.fileKey,
          width: v.width,
          height: v.height,
          alt: img.alt,
          sortOrder: g * 10,
        },
      })
      if (g === 0) coverId = row.id
      console.log(`  ${p.slug}: image ${g + 1}/${p.images.length} (${v.width}x${v.height})`)
    }

    if (coverId) {
      await prisma.project.update({ where: { id: project.id }, data: { coverImageId: coverId } })
    }
    console.log(`Seeded ${p.title}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())