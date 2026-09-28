# -*- coding: utf-8 -*-
"""build.py: write docs/index.html (English) and docs/th/index.html (Thai) from one source.

Built the Mae Hong Son Loop way: one inlined stylesheet, system fonts, site-kit parallax
bands for the photographs, a top bar that folds away, and a Thai edition at /th/.
    python3 tools/build.py
"""
import html
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DOCS = os.path.join(ROOT, "docs")
sys.path.insert(0, HERE)
from bands import band  # noqa: E402

SITE = "https://nanobotco.github.io/pct/"
L = "en"


def e(x):
    return html.escape("" if x is None else str(x))


def t(en, th):
    """Pick the language being built."""
    return th if L == "th" else en


def cred(who, lic, url=""):
    w = f'<a href="{e(url)}">{e(who)}</a>' if url else e(who)
    return f"{w} · {e(lic)}"


C = "https://commons.wikimedia.org/wiki/File:"

# ---- the walk: hand-picked landscape photographs, south to north
WALK = [
    ("south-eagle-rock", "Mile 101", "ไมล์ 101", "Eagle Rock", "หินนกอินทรี",
     "A week out of Mexico, the granite grows wings.", "ออกจากเม็กซิโกได้หนึ่งสัปดาห์ หินแกรนิตก็กางปีก",
     ("Seauton", "CC BY-SA 4.0", C + "Eagle_rock_warner_springs_5.jpg"), ""),
    ("forester-pass", "Mile 779", "ไมล์ 779", "Forester Pass", "ช่องเขาฟอเรสเตอร์",
     "13,153 feet. The top of the trail.", "4,009 เมตร จุดสูงสุดของเส้นทาง",
     ("wetwebwork", "CC BY-SA 2.0", C + "View_from_Forester_Pass_(cropped).jpg"), "right tall"),
    ("evolution-basin", "Mile ~835", "ไมล์ ~835", "Evolution Basin", "แอ่งเอโวลูชัน",
     "Peaks named for Darwin, Mendel and Huxley, standing in their own lakes.",
     "ยอดเขาชื่อดาร์วิน เมนเดล และฮักซ์ลีย์ ยืนสะท้อนอยู่ในทะเลสาบของตัวเอง",
     ("Jeff P", "CC BY 2.0", C + "Mt._Mendel_and_Mt._Darwin_reflected_in_Sapphire_Lake,_Evolution_Basin,_High_Sierra,_California.jpg"), ""),
]
WALK2 = [
    ("burney-falls", "Mile 1419", "ไมล์ 1419", "Burney Falls", "น้ำตกเบอร์นีย์",
     "Spring water pours straight out of the cliff, cold all summer.", "น้ำพุไหลออกจากหน้าผาตรง ๆ เย็นทั้งหน้าร้อน",
     ("Saxena ashes", "CC BY-SA 4.0", C + "The_Burney_Falls_in_April.jpg"), "tall"),
    ("shasta", "Northern California", "แคลิฟอร์เนียตอนเหนือ", "Mount Shasta", "ภูเขาชาสตา",
     "In view for days, from every side.", "มองเห็นอยู่หลายวัน จากทุกทิศ",
     ("Ericshawwhite", "CC BY-SA 3.0", C + "Mount_Shasta_from_the_PCT.jpg"), "right"),
    ("crater-lake", "Mile ~1820", "ไมล์ ~1820", "Crater Lake", "ทะเลสาบเครเตอร์",
     "A volcano's empty heart, filled with snowmelt.", "หัวใจที่ว่างของภูเขาไฟ เต็มไปด้วยน้ำหิมะละลาย",
     ("Pavel Špindler", "CC BY 3.0", C + "Crater_Lake_and_Wizard_Island_-_panoramio.jpg"), ""),
    ("mount-hood", "Mile ~2097", "ไมล์ ~2097", "Timberline Lodge", "ทิมเบอร์ไลน์ลอดจ์",
     "The breakfast buffet is a tradition of its own.", "บุฟเฟต์มื้อเช้าที่นี่เป็นประเพณีอีกอย่างหนึ่ง",
     ("U.S. Forest Service", "public domain", ""), "right"),
    ("bridge-of-the-gods", "Mile 2147", "ไมล์ 2147", "Bridge of the Gods", "สะพานแห่งเทพ",
     "The lowest point on the trail. Walk across into Washington.", "จุดต่ำสุดของเส้นทาง เดินข้ามเข้ารัฐวอชิงตัน",
     ("Cacophony", "CC BY 2.5", C + "BridgeOfTheGods2.jpg"), ""),
]
WALK3 = [
    ("goat-rocks", "Washington", "วอชิงตัน", "Goat Rocks", "โกตร็อกส์",
     "The Knife's Edge runs along this crest.", "สันมีดทอดตัวอยู่บนสันเขานี้",
     ("U.S. Forest Service", "public domain", ""), "right"),
    ("north-cascades", "Mile ~2615", "ไมล์ ~2615", "Grasshopper Pass", "ช่องเขากราสฮอปเปอร์",
     "The last big view before the border.", "วิวใหญ่ครั้งสุดท้ายก่อนถึงชายแดน",
     ("Martin Bravenboer", "CC BY 2.0", C + "Mount_Ballard_from_PCT.jpg"), "tall"),
    ("north-end-manning", "Mile 2650", "ไมล์ 2650", "Canada", "แคนาดา",
     "Touch the monument. Then walk 30 miles back to Harts Pass.", "แตะอนุสรณ์ แล้วเดินกลับอีก 30 ไมล์ไปฮาร์ตส์พาส",
     ("Jason Hollinger", "CC BY 2.0", C + "Silmakeen_River_Valley_(5037828305).jpg"), "right"),
]

SLAB = [("2,650", "miles", "ไมล์"), ("13,153", "feet, Forester Pass", "ฟุต ช่องเขาฟอเรสเตอร์"),
        ("5", "months, end to end", "เดือน ตลอดสาย"), ("3", "states", "รัฐ"),
        ("6,840", "permits, 2024", "ใบอนุญาต ปี 2024"), ("770", "finishers, 2024", "คนเดินจบ ปี 2024")]

TRAD = [
    ("Trail names", "ชื่อบนเส้นทาง", "Other hikers give you one. Many people finish known only by it.",
     "เพื่อนนักเดินป่าตั้งให้ หลายคนเดินจบโดยไม่มีใครรู้ชื่อจริง"),
    ("Trail angels", "นางฟ้าเส้นทาง", "Water caches in the desert, soda in a cooler at a road crossing, a stranger's shower and bed.",
     "น้ำที่ฝากไว้กลางทะเลทราย น้ำอัดลมในกระติกริมถนน ห้องอาบน้ำและเตียงของคนแปลกหน้า"),
    ("Hiker box", "กล่องแบ่งปัน", "Take what you need. Leave what you're tired of carrying.",
     "หยิบของที่ต้องใช้ ทิ้งของที่แบกจนเบื่อ"),
    ("Zero and nero", "วันพัก", "A zero is a day of no trail miles. A nero is nearly zero: into town by lunch.",
     "ซีโร่คือวันที่ไม่เดินเลย นีโร่คือเดินนิดเดียวเข้าเมืองก่อนเที่ยง"),
    ("Hike your own hike", "เดินในแบบของเรา", "Your pace, your gear, your way.",
     "ความเร็วของเรา อุปกรณ์ของเรา ทางของเรา"),
    ("The porch at Kennedy Meadows", "ระเบียงเคนเนดีเมโดวส์", "Mile 702, where the desert ends. Everyone on the porch claps you in.",
     "ไมล์ 702 ทะเลทรายจบตรงนี้ ทุกคนบนระเบียงปรบมือต้อนรับ"),
    ("Milestones in stone", "หลักไมล์จากก้อนหิน", "500, 1000, 2000, spelled on the ground in rocks and pinecones.",
     "เลข 500, 1000, 2000 เรียงด้วยก้อนหินและลูกสนบนพื้น"),
    ("Halfway", "ครึ่งทาง", "A small monument in Lassen National Forest. Its mile number moves with every reroute.",
     "อนุสรณ์เล็ก ๆ ในป่าแลสเซน เลขไมล์ขยับทุกครั้งที่เส้นทางเปลี่ยน"),
    ("The pancake challenge", "ท้ากินแพนเค้ก", "Seiad Valley café: five 13-inch pancakes in two hours, and they're free.",
     "ร้านกาแฟหุบเขาเซียด แพนเค้กห้าแผ่น กว้างแผ่นละ 33 เซนติเมตร หมดในสองชั่วโมง กินฟรี"),
    ("The Oregon Challenge", "ท้าข้ามโอเรกอน", "All of Oregon, about 450 miles, in 14 days.",
     "ทั้งรัฐโอเรกอน ราว 450 ไมล์ ใน 14 วัน"),
    ("PCT Days", "งาน PCT Days", "Every August in Cascade Locks, by the Bridge of the Gods.",
     "ทุกเดือนสิงหาคมที่แคสเคดล็อกส์ ข้างสะพานแห่งเทพ"),
    ("Stehekin cinnamon rolls", "ขนมปังอบเชยสเตฮีกิน", "The last town. The shuttle bus stops at the bakery.",
     "เมืองสุดท้าย รถรับส่งจอดแวะร้านเบเกอรี่"),
    ("The moon", "พระจันทร์", "Some walk the desert at night under a full moon, out of the heat.",
     "บางคนเดินข้ามทะเลทรายตอนกลางคืนใต้พระจันทร์เต็มดวง หนีความร้อน"),
]

TOWNS = [
    ("Belden Town", "เมืองเบลเดน", "Plumas County, CA", "$4.75M", "Listed Jul 2026", "ประกาศขาย ก.ค. 2026",
     "On the trail at mile ~1285, on the Feather River. Hotel, 7 cabins, RV sites, restaurant, bar, store, festival stages.",
     "เส้นทางผ่านกลางเมือง ไมล์ ~1285 ริมแม่น้ำเฟเธอร์ มีโรงแรม กระท่อม 7 หลัง ลานรถบ้าน ร้านอาหาร บาร์ ร้านค้า และเวทีเทศกาล",
     [("Plumas Sun", "https://plumassun.org/2026/07/14/belden-town-resort-festival-venue-offered-for-sale/"),
      ("Washington Post", "https://www.washingtonpost.com/nation/2026/09/25/small-california-town-is-sale-475-million/")]),
    ("Downtown Campo", "ใจกลางเมืองแคมโป", "San Diego County, CA", "$5.995M", "Listed Aug 2026", "ประกาศขาย ส.ค. 2026",
     "A mile or two from the southern terminus. A WWII cavalry post: 28 buildings, the post office among them.",
     "ห่างจุดเริ่มต้นทางใต้หนึ่งถึงสองไมล์ อดีตค่ายทหารม้าสมัยสงครามโลกครั้งที่สอง 28 อาคาร รวมที่ทำการไปรษณีย์",
     [("The Trek", "https://thetrek.co/pacific-crest-trail/pct-southern-terminus-town-is-on-sale-for-6-million/"),
      ("Top Gun CRE", "https://www.topguncre.com/properties-2/431-jeb-stuart-rd")]),
]

# name, place, mile, price, status (en, th), tag class, source
LODGES = [
    ("The Rock Inn", "Lake Hughes, CA", "~478", "—", ("Listed", "ประกาศขาย"), "", "https://www.antelopevalleynews.com/post/the-rock-inn-where-every-stone-tells-a-story-now-up-for-sale"),
    ("Old Sierra City Hotel", "Sierra City, CA", "~1195", "—", ("Unconfirmed", "ยังไม่ยืนยัน"), "q", "https://www.loopnet.com/Listing/212-Main-St-Sierra-City-CA/37792512/"),
    ("Kennedy Meadows General Store", "Tulare County, CA", "~702", "$675,000", ("Listing expired", "ประกาศหมดอายุ"), "q", "https://www.survivalrealty.com/listings/kennedy-meadows-general-store-off-grid/"),
    ("Vermilion Valley Resort", "Edison Lake, CA", "~878", "$975,000", ("Listed 2013–2021", "เคยประกาศ 2013–2021"), "q", "https://www.pcta.org/2013/vermilion-valley-resort-is-for-sale-13378/"),
    ("Bucks Lake Lodge", "Quincy, CA", "~1263", "$291,500", ("Sold", "ขายแล้ว"), "sold", "https://www.sereno.com/223096849/16525-bucks-lake-rd-quincy-california-95971-metrolist"),
    ("Callahan's Mountain Lodge", "Ashland, OR", "~1718", "—", ("Sold 2020", "ขายแล้ว 2020"), "sold", "https://crystalip.com/cip-brokers-the-sale-of-callahans-mountain-lodge-ashland-oregon/"),
    ("Odell Lake Resort", "Crescent, OR", "~1906", "$4.1M", ("Sold 2024", "ขายแล้ว 2024"), "sold", "https://www.landleader.com/listings/odell-lake-resort/548/"),
    ("Elk Lake Resort", "near Bend, OR", "~1954", "$4.56M", ("Sold 2025", "ขายแล้ว 2025"), "sold", "https://bendbulletin.com/2025/04/22/elk-lake-resort-sells/"),
    ("Hiker Heaven", "Agua Dulce, CA", "~454", "—", ("Sold ~2020", "ขายแล้ว ~2020"), "sold", "https://thetrek.co/pacific-crest-trail/hiker-heaven-pct-officially-sale/"),
]

# group, colour, [(name, url, en, th)]
LINKS = [
    ("Fire", "ไฟป่า", "fire", [
        ("Postholer trail fires", "https://www.postholer.com/trail-fires/Pacific-Crest-Trail/1", "fires near the trail, this year and past years", "ไฟป่าใกล้เส้นทาง ปีนี้และปีก่อน ๆ"),
        ("PCTA closures", "https://closures.pcta.org/", "official closures and detours", "ประกาศปิดเส้นทางและทางเลี่ยง"),
        ("InciWeb", "https://inciweb.wildfire.gov/", "one page per wildfire", "หนึ่งหน้าต่อไฟป่าหนึ่งครั้ง"),
        ("NASA FIRMS", "https://firms.modaps.eosdis.nasa.gov/usfs/map/", "satellite hotspots, under 3 hours old", "จุดความร้อนจากดาวเทียม อายุไม่ถึง 3 ชั่วโมง"),
        ("NIFC outlooks", "https://www.nifc.gov/nicc/predictive-services/outlooks", "monthly and seasonal fire outlooks", "คาดการณ์ไฟป่ารายเดือนและรายฤดู"),
    ]),
    ("Snow", "หิมะ", "snow", [
        ("Postholer snow", "https://www.postholer.com/snow/Pacific-Crest-Trail/1", "snow depth along the trail, Nov–Jul", "ความลึกหิมะตลอดเส้นทาง พ.ย.–ก.ค."),
        ("NOAA snow analysis", "https://www.nohrsc.noaa.gov/nsa/", "daily snow depth and water", "ความลึกหิมะและปริมาณน้ำรายวัน"),
        ("CDEC snow", "https://cdec.water.ca.gov/snowapp/sweq.action", "California snowpack against average", "หิมะแคลิฟอร์เนียเทียบค่าเฉลี่ย"),
        ("NRCS SNOTEL", "https://nwcc-apps.sc.egov.usda.gov/imap/", "snow stations, Oregon and Washington", "สถานีวัดหิมะ โอเรกอนและวอชิงตัน"),
    ]),
    ("Flood and fords", "น้ำหลากและจุดลุยน้ำ", "water", [
        ("USGS Water Dashboard", "https://dashboard.waterdata.usgs.gov/", "live streamflow, for fords", "ระดับน้ำสด ใช้ดูจุดลุยข้าม"),
        ("NWS river forecasts", "https://water.noaa.gov/", "flood stages and forecasts", "ระดับน้ำท่วมและพยากรณ์"),
        ("Excessive rainfall outlook", "https://www.wpc.ncep.noaa.gov/qpf/excessive_rainfall_outlook_ero.php", "flash-flood risk, days 1–5", "โอกาสน้ำป่า 1–5 วัน"),
        ("FEMA flood maps", "https://msc.fema.gov/portal/home", "flood zones in trail towns", "พื้นที่น้ำท่วมในเมืองริมเส้นทาง"),
    ]),
    ("Weather", "อากาศ", "wx", [
        ("NWS point forecast", "https://forecast.weather.gov/MapClick.php?lat=32.5897&lon=-116.4669", "opens at the southern terminus; click the map to move", "เปิดที่จุดเริ่มต้นทางใต้ คลิกแผนที่เพื่อย้าย"),
        ("Postholer map", "https://www.postholer.com/map/Pacific-Crest-Trail", "the whole trail with smoke and fire layers", "ทั้งเส้นทาง พร้อมชั้นควันและไฟ"),
        ("NOAA fire weather", "https://www.spc.noaa.gov/products/fire_wx/", "fire-weather outlooks, days 1–8", "สภาพอากาศเสี่ยงไฟ 1–8 วัน"),
    ]),
]

YEARS = [
    ("1968", "Named one of the first two National Scenic Trails, with the Appalachian Trail.", "ได้รับประกาศเป็นเส้นทางชมวิวแห่งชาติสองเส้นแรก คู่กับเส้นทางแอปพาเลเชียน"),
    ("1993", "Finished, with a golden spike in Soledad Canyon.", "สร้างเสร็จ ตอกหมุดทองที่หุบเขาโซลีแดด"),
    ("2017", "Big snow year. Fires closed the Eagle Creek route until 2021 and about 70 miles in Washington.", "หิมะมาก ไฟป่าปิดเส้นทางอีเกิลครีกถึงปี 2021 และราว 70 ไมล์ในวอชิงตัน"),
    ("2020", "The PCTA asked hikers to stay home. 18 finishes reported.", "สมาคมขอให้นักเดินป่าอยู่บ้าน มีคนแจ้งว่าเดินจบ 18 คน"),
    ("2021", "The Dixie Fire closed about 130 miles, mile 1235 to 1365.", "ไฟป่าดิกซีปิดเส้นทางราว 130 ไมล์ ไมล์ 1235 ถึง 1365"),
    ("2023", "California snowpack reached 196% of average. Many hikers skipped the Sierra and came back.", "หิมะแคลิฟอร์เนียมากถึง 196% ของค่าเฉลี่ย หลายคนข้ามเซียร์ราไปก่อนแล้วค่อยกลับมา"),
    ("2025", "Canada ended PCT entry permits.", "แคนาดายกเลิกใบอนุญาตเดินข้ามแดน"),
]

SOURCES = [
    ("Wikipedia: Pacific Crest Trail", "https://en.wikipedia.org/wiki/Pacific_Crest_Trail"),
    ("PCTA FAQ", "https://www.pcta.org/discover-the-trail/faq/"),
    ("PCTA permit and completion numbers", "https://www.pcta.org/our-work/trail-and-land-management/pct-visitor-use-statistics/"),
    ("U.S. Forest Service: the PCT", "https://www.fs.usda.gov/trails/pacific-crest-nst/about-trail"),
    ("PCTA: Dixie Fire closure", "https://www.pcta.org/discover-the-trail/closures/northern-california/dixie-fire-in-feather-river-canyon-region/"),
    ("PCTA: Eagle Creek reopens", "https://www.pcta.org/2021/eagle-creek-trail-reopens-after-three-years-of-work-by-volunteers-87482/"),
    ("Backpacker: the 2023 snow year", "https://www.backpacker.com/trips/long-trails/pacific-crest-trail/this-is-the-year-of-the-flip-flop-on-the-pacific-crest-trail/"),
    ("Trailside Reader: the pancake challenge", "https://pcttrailsidereader.com/post/620556180985692160/pct-traditions-the-pancake-challenge"),
    ("Postholer", "https://www.postholer.com/"),
    ("Burney Mountain Guest Ranch", "https://burneymountain.com/"),
    ("LongTrailsWiki: Burney Mountain", "http://www.longtrailswiki.net/wiki/Burney_Mountain_Guest_Ranch"),
    ("Wikimedia Commons", "https://commons.wikimedia.org/"),
]


def bands(rows, r):
    out = []
    for img, ken, kth, hen, hth, len_, lth, (who, lic, url), cls in rows:
        out.append(band(r + "img/" + img + ".jpg", kicker=t(ken, kth), head=t(hen, hth), line=t(len_, lth),
                        credit=cred(who, lic, url), cls=cls))
    return "\n".join(out)


def page():
    r = "../" if L == "th" else ""
    here = SITE + ("th/" if L == "th" else "")
    title = t("Pacific Crest Trail", "เส้นทางแปซิฟิกเครสต์")
    desc = t("Mexico to Canada, 2,650 miles: the trail drawn in stars, photographs south to north, "
             "trail traditions, whole towns for sale, fire and snow maps, Burney Mountain Guest Ranch.",
             "จากเม็กซิโกถึงแคนาดา 2,650 ไมล์ เส้นทางที่วาดเป็นกลุ่มดาว ภาพจากใต้ขึ้นเหนือ ประเพณีบนเส้นทาง "
             "เมืองทั้งเมืองที่ประกาศขาย แผนที่ไฟป่าและหิมะ และฟาร์มพักแรมเบอร์นีย์เมาเทน")
    nav = [("walk", "Walk", "เดิน"), ("traditions", "Traditions", "ประเพณี"), ("burney", "Burney", "เบอร์นีย์"),
           ("sale", "For sale", "ประกาศขาย"), ("conditions", "Fire · snow", "ไฟป่า · หิมะ"),
           ("years", "Years", "ปี"), ("sources", "Sources", "แหล่งข้อมูล")]
    navh = "".join(f'<a href="#{a}">{e(t(b, c))}</a>' for a, b, c in nav)
    en_cur = ' aria-current="page"' if L == "en" else ""
    th_cur = ' aria-current="page"' if L == "th" else ""
    langsw = (f'<a href="{r}" hreflang="en" lang="en"{en_cur}>EN</a> '
              f'<a href="{r}th/" hreflang="th" lang="th"{th_cur}>ไทย</a>')

    slab = "".join(f'<div><b>{e(n)}</b><span>{e(t(a, b))}</span></div>' for n, a, b in SLAB)

    trad = "".join(f'<div class="tr"><h3>{e(t(a, b))}</h3><p>{e(t(c, d))}</p></div>' for a, b, c, d in TRAD)

    towns = ""
    for n, nth, place, price, sen, sth, den, dth, src in TOWNS:
        links = " · ".join(f'<a href="{e(u)}">{e(s)}</a>' for s, u in src)
        towns += (f'<div class="town"><span class="tag">{e(t(sen, sth))}</span><b class="price">{e(price)}</b>'
                  f'<h3>{e(t(n, nth))}</h3><p class="mute small">{e(place)}</p><p>{e(t(den, dth))}</p>'
                  f'<p class="small">{links}</p></div>')

    lodges = "".join(
        f'<tr><td><a href="{e(u)}"><b>{e(n)}</b></a><br><span class="mute small">{e(pl)}</span></td>'
        f'<td>{e(mi)}</td><td class="p">{e(pr)}</td><td><span class="tag {cls}">{e(t(*st))}</span></td></tr>'
        for n, pl, mi, pr, st, cls, u in LODGES)

    links = ""
    for g, gth, col, rows in LINKS:
        items = "".join(f'<li><a href="{e(u)}">{e(n)}</a><span>{e(t(a, b))}</span></li>' for n, u, a, b in rows)
        links += f'<div class="lk {col}"><h3>{e(t(g, gth))}</h3><ul>{items}</ul></div>'

    years = "".join(f'<li><b>{y}</b><span>{e(t(a, b))}</span></li>' for y, a, b in YEARS)
    srcs = "".join(f'<li><a href="{e(u)}">{e(n)}</a></li>' for n, u in SOURCES)

    css = open(os.path.join(HERE, "bands.css"), encoding="utf-8").read() + CSS

    return f"""<!doctype html><html lang="{L}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google" content="notranslate">
<title>{e(title)} · {e(t("Mexico to Canada", "เม็กซิโกถึงแคนาดา"))}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{here}">
<link rel="alternate" hreflang="en" href="{SITE}"><link rel="alternate" hreflang="th" href="{SITE}th/"><link rel="alternate" hreflang="x-default" href="{SITE}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Pacific Crest Trail · เส้นทางแปซิฟิกเครสต์">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{here}">
<meta property="og:image" content="{SITE}card.jpg"><meta property="og:image:secure_url" content="{SITE}card.jpg"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(t("The Pacific Crest Trail drawn as a constellation under the moon", "เส้นทางแปซิฟิกเครสต์วาดเป็นกลุ่มดาวใต้แสงจันทร์"))}">
<meta property="og:locale" content="{t("en_US", "th_TH")}"><meta property="og:locale:alternate" content="{t("th_TH", "en_US")}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}card.jpg">
<link rel="icon" href="{r}icon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="{SITE}llms.txt" title="llms.txt">
<style>{css}</style>
</head><body>
<header class="top"><div class="in">
<a class="brand" href="{r}{"th/" if L == "th" else ""}">PCT <b>✦</b> <span class="th">แปซิฟิกเครสต์</span></a>
<nav aria-label="{e(t("Sections", "หัวข้อ"))}">{navh}</nav>
<span class="langsw">{langsw}</span>
</div></header>

<section class="sky" aria-label="{e(t("The trail drawn as a constellation", "เส้นทางวาดเป็นกลุ่มดาว"))}">
<canvas id="sky" aria-hidden="true"></canvas>
<div class="in">
<span class="kicker">{e(t("Mexico · 2,650 miles · Canada", "เม็กซิโก · 2,650 ไมล์ · แคนาดา"))}</span>
<h1>{e(title)}</h1>
<p class="lede">{e(t("A footpath along the crest of the West, drawn in stars at the real positions of its towns and passes, under the sun and moon where you are right now.",
                     "ทางเดินเท้าตามสันเขาฝั่งตะวันตกของอเมริกา วาดเป็นดวงดาวตามตำแหน่งจริงของเมืองและช่องเขา ใต้ดวงอาทิตย์และพระจันทร์ ณ ที่ที่คุณอยู่ตอนนี้"))}</p>
<p class="moon" id="skynow"></p>
<button type="button" class="here" id="here">{e(t("Use my location", "ใช้ตำแหน่งของฉัน"))}</button>
</div>
</section>

<main>
<div class="slab">{slab}</div>
<p class="lede">{e(t("From the Mexican border near Campo to Manning Park at the Canadian border, through California, Oregon and Washington. Most people who walk it all take about five months, April to September.",
                     "จากชายแดนเม็กซิโกใกล้แคมโปถึงอุทยานแมนนิงที่ชายแดนแคนาดา ผ่านแคลิฟอร์เนีย โอเรกอน และวอชิงตัน คนที่เดินจบทั้งเส้นใช้เวลาราวห้าเดือน เมษายนถึงกันยายน"))}</p>

<div id="walk"></div>
{bands(WALK, r)}

<section id="burney" class="burney">
<figure><img src="{r}img/burney-bunks.jpg" alt="{e(t("The PCT bunk room: log bunk beds with patterned quilts", "ห้องนอนรวมของนักเดินป่า เตียงสองชั้นไม้ซุงกับผ้าห่มลาย"))}" width="600" height="337" loading="lazy"></figure>
<div class="b">
<span class="kicker">{e(t("Mile 1411 · Cassel, California", "ไมล์ 1411 · เมืองแคสเซิล แคลิฟอร์เนีย"))}</span>
<h2>Burney Mountain Guest Ranch</h2>
<p>{e(t("A family ranch 0.8 miles off the trail, between Hat Creek Rim and Burney Falls. Bunks, camping, cabins, three meals a day, showers, laundry with loaner clothes, a hiker box, and a small resupply store. Open from May.",
        "ฟาร์มของครอบครัว ห่างเส้นทาง 0.8 ไมล์ ระหว่างผาแฮตครีกกับน้ำตกเบอร์นีย์ มีเตียงรวม ที่กางเต็นท์ กระท่อม อาหารสามมื้อ ห้องอาบน้ำ ซักผ้าพร้อมเสื้อผ้าให้ยืม กล่องแบ่งปัน และร้านเสบียงเล็ก ๆ เปิดตั้งแต่เดือนพฤษภาคม"))}</p>
<p class="small">{e(t("Resupply boxes by UPS or FedEx (USPS doesn't deliver there), marked with your name and the date you expect to arrive.",
                      "ส่งกล่องเสบียงทาง UPS หรือ FedEx (ไปรษณีย์ USPS ไม่ส่งถึง) เขียนชื่อและวันที่คาดว่าจะไปถึง"))}</p>
<p><a class="btn" href="https://burneymountain.com/">burneymountain.com</a> <a class="btn ghost" href="tel:+12064809162">206-480-9162</a></p>
</div>
</section>

{bands(WALK2, r)}

<section id="traditions">
<h2>{e(t("Traditions", "ประเพณีบนเส้นทาง"))}</h2>
<div class="trads">{trad}</div>
</section>

{bands(WALK3, r)}

<section id="sale">
<h2>{e(t("For sale", "ประกาศขาย"))}</h2>
<p class="lede">{e(t("Two whole towns on the trail are on the market.", "มีสองเมืองริมเส้นทางประกาศขายทั้งเมือง"))}</p>
<div class="towns">{towns}</div>
<h3>{e(t("Lodges, stores, hostels", "ที่พัก ร้านค้า โฮสเทล"))}</h3>
<table class="tbl"><thead><tr><th>{e(t("Place", "สถานที่"))}</th><th>{e(t("Mile", "ไมล์"))}</th><th>{e(t("Asking", "ราคา"))}</th><th>{e(t("Status", "สถานะ"))}</th></tr></thead><tbody>{lodges}</tbody></table>
<p class="mute small">{e(t("Checked 28 September 2026. Prices and status as reported; miles approximate.", "ตรวจเมื่อ 28 กันยายน 2026 ราคาและสถานะตามที่มีรายงาน เลขไมล์โดยประมาณ"))}</p>
</section>

<section id="conditions">
<h2>{e(t("Fire · snow · flood", "ไฟป่า · หิมะ · น้ำหลาก"))}</h2>
<p class="lede">{e(t("Snow opens the Sierra, usually mid-June. Fire decides the rest of summer.", "หิมะเป็นตัวเปิดเทือกเขาเซียร์รา ปกติกลางเดือนมิถุนายน ไฟป่ากำหนดหน้าร้อนที่เหลือ"))}</p>
<div class="lks">{links}</div>
</section>

<section id="years">
<h2>{e(t("Years", "ปีที่จำได้"))}</h2>
<ol class="years">{years}</ol>
</section>

<section id="sources">
<h2>{e(t("Sources", "แหล่งข้อมูล"))}</h2>
<ul class="src">{srcs}</ul>
<p class="mute small">{e(t("Photos from Wikimedia Commons, credited on each. Burney Mountain photo from the ranch.", "ภาพจากวิกิมีเดียคอมมอนส์ ระบุผู้ถ่ายบนภาพ ภาพเบอร์นีย์เมาเทนจากฟาร์ม"))}</p>
</section>
</main>
<footer class="bot"><div class="in">{e(t("Text CC BY 4.0, NaNoBotCo. Photographs keep their own licences.", "ข้อความ CC BY 4.0 NaNoBotCo ภาพถ่ายใช้สัญญาอนุญาตของแต่ละภาพ"))} · <a href="https://github.com/NaNoBotCo/pct">GitHub</a></div></footer>
<script src="{r}sky.js" defer></script><script src="{r}top.js" defer></script>
</body></html>
"""


CSS = """
:root{
 --bg:#fbf8f1;--panel:#fff;--ink:#16121f;--mute:#62586f;--line:#e4dccb;
 --accent:#7b4bd1;--hot:#d9480f;--gold:#f0a500;--jade:#00806a;--sky:#2f64c8;
 --fire:#d9480f;--snow:#2f7fc8;--water:#0a8aa0;--wx:#00806a;--shadow:rgba(20,10,40,.12);
 --display:"Avenir Next Condensed","HelveticaNeue-CondensedBold","Arial Narrow Bold","Franklin Gothic Heavy",Impact,system-ui,sans-serif;
 --body:"Avenir Next",Avenir,"Segoe UI",system-ui,-apple-system,Helvetica,Arial,sans-serif;
 --thai:"Noto Sans Thai","Leelawadee UI","Thonburi","Sukhumvit Set",Tahoma,sans-serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --bg:#0f0c18;--panel:#1a1626;--ink:#f1ecfa;--mute:#b1a6c4;--line:#2e2740;
 --accent:#b395ff;--hot:#ff8a4c;--gold:#ffc23d;--jade:#2fc9a8;--sky:#7fb0ff;
 --fire:#ff8a4c;--snow:#7fb6ff;--water:#4fd0e0;--wx:#2fc9a8;--shadow:rgba(0,0,0,.5)}}
:root[data-theme="dark"]{
 --bg:#0f0c18;--panel:#1a1626;--ink:#f1ecfa;--mute:#b1a6c4;--line:#2e2740;
 --accent:#b395ff;--hot:#ff8a4c;--gold:#ffc23d;--jade:#2fc9a8;--sky:#7fb0ff;
 --fire:#ff8a4c;--snow:#7fb6ff;--water:#4fd0e0;--wx:#2fc9a8;--shadow:rgba(0,0,0,.5)}
*{box-sizing:border-box}
html{font-size:18px;scroll-behavior:smooth;scroll-padding-top:3.5rem}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);line-height:1.6;-webkit-text-size-adjust:100%;overflow-x:hidden}
:lang(th),.th{font-family:var(--thai);line-height:1.85}
a{color:var(--accent);text-underline-offset:.18em}
a:focus-visible{outline:3px solid var(--gold);outline-offset:2px;border-radius:4px}
img{max-width:100%;height:auto;display:block}
.mute{color:var(--mute)}.small{font-size:.84rem}

header.top{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:2px solid var(--ink);
 transition:transform .26s cubic-bezier(.4,0,.2,1),box-shadow .26s}
body.nav-away header.top{transform:translateY(-102%)}
body.nav-tight header.top{box-shadow:0 10px 24px -14px var(--shadow)}
header.top nav,header.top .langsw{transition:opacity .18s,max-height .26s,margin .26s}
body.nav-tight header.top nav,body.nav-tight header.top .langsw{opacity:0;max-height:0;margin-block:0;overflow:hidden;pointer-events:none}
header.top .in{max-width:68rem;margin:0 auto;padding:.5rem 1rem;display:flex;gap:.4rem 1rem;align-items:center;flex-wrap:wrap}
.brand{font-family:var(--display);font-weight:800;font-size:1.2rem;text-transform:uppercase;text-decoration:none;color:var(--ink);white-space:nowrap}
.brand b{color:var(--gold)}.brand .th{font-size:.85rem;font-weight:600;text-transform:none}
header.top nav{display:flex;gap:.1rem .7rem;flex-wrap:wrap;font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
header.top nav a{text-decoration:none;color:var(--mute)}
header.top nav a:hover{color:var(--ink);box-shadow:inset 0 -3px 0 var(--accent)}
.langsw{margin-left:auto;font-size:.76rem;font-weight:800;letter-spacing:.08em}
.langsw a{text-decoration:none;padding:.18rem .5rem;border:2px solid var(--line);border-radius:99px;color:var(--mute)}
.langsw a[aria-current]{background:var(--ink);color:var(--bg);border-color:var(--ink)}

.sky{position:relative;min-height:min(92vh,860px);display:grid;align-items:end;color:#fff;background:#0b0a22;isolation:isolate;overflow:hidden}
.sky canvas{position:absolute;inset:0;width:100%;height:100%;z-index:-2}
.sky .in{max-width:68rem;margin:0 auto;width:100%;padding:3rem 1rem 3.2rem}
.sky .kicker{display:block;font-family:var(--display);font-size:.72rem;font-weight:800;letter-spacing:.34em;text-transform:uppercase;color:#ffd97a;margin-bottom:.6rem}
.sky h1{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:clamp(2.6rem,9vw,5.6rem);line-height:.9;margin:0;max-width:9ch;text-shadow:0 0 30px rgba(180,150,255,.55)}
.sky .lede{max-width:24rem;color:#e6defc;text-shadow:0 1px 12px #000}
.sky::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,rgba(8,6,26,.26),rgba(8,6,26,0) 50%);opacity:0;transition:opacity 1s}
.sky-day .sky::before{opacity:1}
.sky .moon{display:inline-block;font-size:.78rem;letter-spacing:.06em;color:#fbf1d6;font-weight:700;margin:.2rem 0 .7rem;max-width:36rem;background:rgba(8,6,26,.55);padding:.35rem .7rem;border-radius:10px;backdrop-filter:blur(3px)}
.sky .moon:empty{display:none}
.sky-day .sky h1{text-shadow:0 2px 24px rgba(10,20,60,.55)}
.here{font:800 .72rem var(--display);letter-spacing:.14em;text-transform:uppercase;color:#fbf1d6;background:rgba(255,255,255,.1);border:2px solid rgba(251,241,214,.6);border-radius:99px;padding:.4rem .9rem;cursor:pointer}
.here:hover{background:rgba(255,255,255,.2)}.here[hidden]{display:none}
:lang(th) .here{font-family:var(--thai);letter-spacing:0;text-transform:none;font-size:.85rem}
@media (max-width:760px){.sky .in{padding-top:40vh}.sky .lede{max-width:none}}

main{max-width:68rem;margin:0 auto;padding:1rem 1rem 4rem}
h2{font-family:var(--display);font-size:clamp(1.6rem,4.4vw,2.4rem);line-height:1;margin:3rem 0 .8rem;font-weight:800;text-transform:uppercase;border-bottom:3px solid var(--ink);padding-bottom:.25rem}
h3{font-family:var(--display);font-size:1.15rem;margin:1.4rem 0 .3rem;font-weight:800;text-transform:uppercase;letter-spacing:.02em}
:lang(th) h1,:lang(th) h2,:lang(th) h3,:lang(th) .kicker,:lang(th) .band h2{font-family:var(--thai);letter-spacing:0;line-height:1.25}
p{margin:.6rem 0;max-width:42rem}
.lede{font-size:clamp(1.05rem,2.3vw,1.25rem);max-width:42rem}
.kicker{display:block;font-family:var(--display);font-size:.72rem;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:var(--accent);margin-bottom:.4rem}

.slab{display:grid;grid-template-columns:repeat(6,1fr);border:3px solid var(--ink);margin:1.4rem 0;background:var(--bg)}
.slab div{padding:.75rem .8rem;border-right:3px solid var(--ink)}
.slab div:last-child{border-right:0}
.slab b{display:block;font-family:var(--display);font-size:clamp(1.9rem,4.6vw,2.8rem);line-height:.92;font-weight:800;color:var(--accent)}
.slab span{display:block;font-size:.66rem;text-transform:uppercase;letter-spacing:.12em;color:var(--mute);font-weight:800;margin-top:.3rem}
:lang(th) .slab span{letter-spacing:0;font-size:.8rem;text-transform:none}
@media (max-width:760px){.slab{grid-template-columns:repeat(2,1fr)}.slab div{border-bottom:3px solid var(--ink)}.slab div:nth-child(2n){border-right:0}.slab div:nth-last-child(-n+2){border-bottom:0}}

.band .in{max-width:68rem}
.band .kicker{color:#ffd97a}
.btn{display:inline-block;font-family:var(--display);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.85rem;padding:.55rem 1rem;border-radius:99px;background:var(--accent);color:#fff;text-decoration:none;margin:.2rem .3rem .2rem 0}
.btn.ghost{background:transparent;color:var(--accent);box-shadow:inset 0 0 0 2px var(--accent)}

.burney{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:0;border:3px solid var(--ink);background:var(--panel);margin:2.6rem 0;overflow:hidden}
.burney figure{margin:0;background:#2a1a10}
.burney figure img{width:100%;height:100%;object-fit:cover}
.burney .b{padding:1.2rem 1.3rem}
.burney h2{border:0;margin:.1rem 0 .6rem;padding:0}
@media (max-width:760px){.burney{grid-template-columns:1fr}}

.trads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}
.tr{background:var(--panel);border:2px solid var(--line);border-radius:12px;padding:.8rem 1rem;position:relative}
.tr::before{content:"✦";position:absolute;right:.8rem;top:.55rem;color:var(--gold)}
.tr h3{margin:.1rem 1.4rem .3rem 0;font-size:1.05rem}
.tr p{margin:0;font-size:.95rem}
@media (max-width:900px){.trads{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.trads{grid-template-columns:1fr}}

.towns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin:1rem 0 1.6rem}
.town{border:3px solid var(--ink);background:var(--panel);padding:1rem 1.1rem;position:relative}
.town .price{display:block;font-family:var(--display);font-size:clamp(2.2rem,6vw,3.2rem);line-height:.95;color:var(--hot);margin:.4rem 0 .1rem}
.town h3{margin:.2rem 0 0;font-size:1.4rem}
@media (max-width:640px){.towns{grid-template-columns:1fr}}
.tag{display:inline-block;font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:.1rem .5rem;border-radius:99px;background:var(--jade);color:#fff}
.tag.sold{background:var(--mute)}.tag.q{background:var(--sky)}
.tbl{width:100%;border-collapse:collapse;font-size:.95rem;margin:.6rem 0 1rem}
.tbl th,.tbl td{text-align:left;vertical-align:top;padding:.55rem .5rem;border-bottom:2px solid var(--line)}
.tbl th{font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:var(--mute)}
.tbl td.p{font-weight:800;white-space:nowrap}
@media (max-width:620px){.tbl thead{display:none}.tbl tr{display:grid;grid-template-columns:1fr auto;gap:.1rem .8rem;border-bottom:2px solid var(--line);padding:.6rem 0}
 .tbl td{border:0;padding:0}.tbl td:first-child{grid-column:1/-1}}

.lks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.lk{border:2px solid var(--line);border-top:6px solid var(--c,var(--accent));border-radius:10px;background:var(--panel);padding:.4rem 1rem .8rem}
.lk.fire{--c:var(--fire)}.lk.snow{--c:var(--snow)}.lk.water{--c:var(--water)}.lk.wx{--c:var(--wx)}
.lk h3{color:var(--c)}
.lk ul{list-style:none;padding:0;margin:0}
.lk li{padding:.35rem 0;border-bottom:1px dashed var(--line)}
.lk li:last-child{border-bottom:0}
.lk a{font-weight:800}.lk span{display:block;font-size:.86rem;color:var(--mute)}
@media (max-width:640px){.lks{grid-template-columns:1fr}}

.years{list-style:none;padding:0;margin:1rem 0;border-left:3px solid var(--accent)}
.years li{padding:.1rem 0 .9rem 1rem;position:relative}
.years li::before{content:"";position:absolute;left:-.5rem;top:.55rem;width:.7rem;height:.7rem;border-radius:50%;background:var(--gold);box-shadow:0 0 10px var(--gold)}
.years b{font-family:var(--display);font-size:1.3rem;display:block;line-height:1.1}
.src{columns:2 18rem;padding-left:1.1rem}
.src li{margin-bottom:.3rem;break-inside:avoid}
footer.bot{border-top:2px solid var(--line)}
footer.bot .in{max-width:68rem;margin:0 auto;padding:1.4rem 1rem 3rem;font-size:.82rem;color:var(--mute)}
footer.bot a{color:var(--mute)}
@media print{.sky canvas,header.top{display:none}.sky{background:none;color:var(--ink);min-height:0}}
"""


def main():
    global L
    for lang, path in (("en", "index.html"), ("th", "th/index.html")):
        L = lang
        out = os.path.join(DOCS, path)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8").write(page())
        print("wrote", out)


if __name__ == "__main__":
    main()
