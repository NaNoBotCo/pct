/* sky.js: the PCT drawn as a constellation, under the sky the reader is standing under.
   The sun and moon sit at their real altitude and compass bearing for the reader's place
   and time; the sky colour follows the sun's altitude. Place: the reader's time zone
   gives a city, or "Use my location" gives the device position. Positions use the
   standard low-precision formulas (Meeus; Astronomy Answers), good to a fraction of a
   degree, finer than a pixel here.
   Test hooks: ?t=2026-09-28T13:00:00Z  ?ll=18.79,98.98 */
(function(){
var cv=document.getElementById('sky');if(!cv)return;
var cx=cv.getContext('2d'),dpr=Math.min(window.devicePixelRatio||1,2);
var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var lang=document.documentElement.lang==='th'?'th':'en';
var Q=new URLSearchParams(location.search),T0=Q.get('t')?Date.parse(Q.get('t')):null,boot=Date.now();
function now(){return T0?new Date(T0+(Date.now()-boot)):new Date()}

/* ---- astronomy */
var rad=Math.PI/180,E=rad*23.4397,sin=Math.sin,cos=Math.cos,asin=Math.asin,atan=Math.atan2,acos=Math.acos;
function days(d){return d.valueOf()/864e5-0.5+2440588-2451545}
function ra(l,b){return atan(sin(l)*cos(E)-Math.tan(b)*sin(E),cos(l))}
function dec(l,b){return asin(sin(b)*cos(E)+cos(b)*sin(E)*sin(l))}
function sid(d,lw){return rad*(280.16+360.9856235*d)-lw}
function sunC(d){var M=rad*(357.5291+0.98560028*d),C=rad*(1.9148*sin(M)+0.02*sin(2*M)+0.0003*sin(3*M)),L=M+C+rad*102.9372+Math.PI;return{dec:dec(L,0),ra:ra(L,0)}}
function moonC(d){var L=rad*(218.316+13.176396*d),M=rad*(134.963+13.064993*d),F=rad*(93.272+13.229350*d),l=L+rad*6.289*sin(M),b=rad*5.128*sin(F);return{ra:ra(l,b),dec:dec(l,b),dist:385001-20905*cos(M)}}
function pos(c,d,lat,lon){var lw=rad*-lon,phi=rad*lat,H=sid(d,lw)-c.ra;
  return{alt:asin(sin(phi)*sin(c.dec)+cos(phi)*cos(c.dec)*cos(H))/rad,
    az:(atan(sin(H),cos(H)*sin(phi)-Math.tan(c.dec)*cos(phi))/rad+180+360)%360,
    pa:atan(sin(H),Math.tan(phi)*cos(c.dec)-sin(c.dec)*cos(H))}}
function sky(date,lat,lon){var d=days(date),s=sunC(d),m=moonC(d),S=149598000,
  ph=acos(sin(s.dec)*sin(m.dec)+cos(s.dec)*cos(m.dec)*cos(s.ra-m.ra)),inc=atan(S*sin(ph),m.dist-S*cos(ph)),
  ang=atan(cos(s.dec)*sin(s.ra-m.ra),sin(s.dec)*cos(m.dec)-cos(s.dec)*sin(m.dec)*cos(s.ra-m.ra)),
  sp=pos(s,d,lat,lon),mp=pos(m,d,lat,lon);
  return{sun:sp,moon:mp,frac:(1+cos(inc))/2,limb:ang-mp.pa}}

/* ---- where: the time zone gives a city; the button gives the device */
var Z={'Asia/Bangkok':[18.79,98.98,'Chiang Mai','เชียงใหม่'],'America/Los_Angeles':[40.25,-121.40,'the PCT midpoint','จุดกึ่งกลางเส้นทาง'],
'America/Vancouver':[49.28,-123.12,'Vancouver','แวนคูเวอร์'],'America/Denver':[39.74,-104.99,'Denver','เดนเวอร์'],'America/Phoenix':[33.45,-112.07,'Phoenix','ฟีนิกซ์'],
'America/Chicago':[41.88,-87.63,'Chicago','ชิคาโก'],'America/New_York':[40.71,-74.01,'New York','นิวยอร์ก'],'America/Anchorage':[61.22,-149.9,'Anchorage','แองเคอเรจ'],
'Pacific/Honolulu':[21.31,-157.86,'Honolulu','โฮโนลูลู'],'Europe/London':[51.51,-0.13,'London','ลอนดอน'],'Europe/Paris':[48.86,2.35,'Paris','ปารีส'],
'Europe/Berlin':[52.52,13.40,'Berlin','เบอร์ลิน'],'Asia/Tokyo':[35.68,139.69,'Tokyo','โตเกียว'],'Asia/Singapore':[1.35,103.82,'Singapore','สิงคโปร์'],
'Asia/Ho_Chi_Minh':[10.82,106.63,'Ho Chi Minh City','โฮจิมินห์'],'Asia/Vientiane':[17.97,102.60,'Vientiane','เวียงจันทน์'],'Asia/Yangon':[16.84,96.17,'Yangon','ย่างกุ้ง'],
'Asia/Shanghai':[31.23,121.47,'Shanghai','เซี่ยงไฮ้'],'Asia/Kolkata':[28.61,77.21,'Delhi','เดลี'],'Australia/Sydney':[-33.87,151.21,'Sydney','ซิดนีย์'],'Pacific/Auckland':[-36.85,174.76,'Auckland','โอ๊คแลนด์']};
var here=(function(){var ll=(Q.get('ll')||'').split(',').map(Number);
  if(ll.length===2&&!isNaN(ll[0])&&!isNaN(ll[1]))return{lat:ll[0],lon:ll[1],name:ll.join(', '),noclock:1};
  var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
  var z=Z[tz];if(z)return{lat:z[0],lon:z[1],name:lang==='th'?z[3]:z[2]};
  return{lat:35,lon:-now().getTimezoneOffset()/4,name:lang==='th'?'เขตเวลาของคุณ':'your time zone'}})();

/* ---- the trail, [lat, lon, English, Thai] */
var P=[[32.59,-116.47,'Mexico','เม็กซิโก'],[33.28,-116.63],[33.81,-116.68],[34.31,-117.47],[34.49,-118.32],
[35.10,-118.29],[35.66,-118.03],[36.03,-118.13,'Kennedy Meadows','เคนเนดีเมโดวส์'],[36.69,-118.37,'Forester Pass','ฟอเรสเตอร์'],
[37.11,-118.67],[37.87,-119.36],[38.33,-119.64],[38.83,-120.04],[39.57,-120.64],[40.01,-121.25],
[40.35,-121.40],[40.47,-121.45],[40.87,-121.53,'Burney Mountain','เบอร์นีย์เมาเทน'],[41.01,-121.65],[41.15,-122.32],
[41.45,-122.89],[41.84,-123.19],[42.06,-122.60],[42.94,-122.12,'Crater Lake','ทะเลสาบเครเตอร์'],[43.60,-122.03],
[44.26,-121.81],[45.33,-121.71],[45.66,-121.90,'Bridge of the Gods','สะพานแห่งเทพ'],[46.50,-121.43],[46.64,-121.38],
[47.43,-121.41],[47.75,-121.09],[48.35,-120.72],[48.72,-120.67],[49.00,-120.80,'Canada','แคนาดา']];
var W,H,HZ,pts=[],stars=[],seg=[],total=0,t0=null,shoot=null,S=null,lastS=0;
function size(){
  var r=cv.getBoundingClientRect();W=r.width;H=r.height;HZ=H-24;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cx.setTransform(dpr,0,0,dpr,0,0);
  var wide=W>760,boxW=wide?W*0.44:W*0.9,boxH=wide?H*0.78:H*0.4,ox=wide?W*0.52:W*0.05,oy=wide?H*0.1:H*0.07;
  var k=cos(41*rad),x0=-123.3*k,x1=-116.3*k,y0=32.5,y1=49.1,s=Math.min(boxW/(x1-x0),boxH/(y1-y0));
  var mx=ox+(boxW-(x1-x0)*s)/2,my=oy+(boxH-(y1-y0)*s)/2;
  pts=P.map(function(p){return{x:mx+(p[1]*k-x0)*s,y:my+(y1-p[0])*s,l:p[2]?(lang==='th'?p[3]:p[2]):'',big:!!p[2]}});
  seg=[];total=0;for(var i=1;i<pts.length;i++){var d=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);seg.push(d);total+=d}
  stars=[];var n=Math.round(W*H/2600);for(i=0;i<n;i++)stars.push({x:Math.random()*W,y:Math.random()*HZ*0.95,r:Math.random()*1.2+0.2,p:Math.random()*6.3,s:Math.random()*1.5+0.4});
}
/* the view faces the equator, 240 degrees wide: south in the northern hemisphere, north in the southern */
function place(o){var face=here.lat>=0?180:0,rel=((o.az-face+540)%360)-180;if(Math.abs(rel)>120)return null;
  return{x:W/2+(here.lat>=0?rel:-rel)/120*(W/2),y:HZ-Math.max(-8,o.alt)/90*(HZ-H*0.06)}}
/* sky colour keyed to the sun's altitude */
var K=[[-18,'#070a1f','#3a1f4f'],[-10,'#141a45','#5b3a6e'],[-4,'#2a2f6b','#d0705a'],[2,'#3f64a8','#f2a765'],[10,'#3a78c9','#bcd6ee'],[40,'#2d6fc4','#a6cdf2']];
function mix(a,b,f){var p=parseInt(a.slice(1),16),q=parseInt(b.slice(1),16),o=[16,8,0].map(function(s){var x=(p>>s)&255,y=(q>>s)&255;return Math.round(x+(y-x)*f)});return'rgb('+o.join(',')+')'}
function tint(alt){if(alt<=K[0][0])return[K[0][1],K[0][2]];for(var i=1;i<K.length;i++)if(alt<=K[i][0]){var f=(alt-K[i-1][0])/(K[i][0]-K[i-1][0]);return[mix(K[i-1][1],K[i][1],f),mix(K[i-1][2],K[i][2],f)]}return[K[K.length-1][1],K[K.length-1][2]]}
function drawSun(p,alt){var r=Math.max(16,Math.min(W,H)*0.05),low=alt<8;
  var g=cx.createRadialGradient(p.x,p.y,r*0.4,p.x,p.y,r*5);g.addColorStop(0,low?'rgba(255,190,120,.55)':'rgba(255,250,220,.6)');g.addColorStop(1,'rgba(255,220,150,0)');
  cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,r*5,0,7);cx.fill();cx.fillStyle=low?'#ffb35c':'#fff6d8';cx.beginPath();cx.arc(p.x,p.y,r,0,7);cx.fill()}
/* limb = zenith angle of the bright limb, anticlockwise; rotate so +x points at it */
function drawMoon(p,frac,limb,day){var r=Math.max(13,Math.min(W,H)*0.042);
  var g=cx.createRadialGradient(p.x,p.y,r*0.6,p.x,p.y,r*4);g.addColorStop(0,'rgba(255,244,214,'+(day?0.08:0.2)+')');g.addColorStop(1,'rgba(255,244,214,0)');
  cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,r*4,0,7);cx.fill();
  cx.save();cx.translate(p.x,p.y);cx.rotate(-Math.PI/2-limb);
  cx.fillStyle=day?'rgba(255,255,255,.12)':'rgba(40,36,64,.9)';cx.beginPath();cx.arc(0,0,r,0,7);cx.fill();
  var k=1-2*frac,h=Math.PI/2;cx.fillStyle=day?'rgba(255,255,255,.85)':'#fbf1d6';cx.beginPath();cx.arc(0,0,r,-h,h,false);cx.ellipse(0,0,Math.abs(k)*r,r,0,h,-h,k>0);cx.fill();cx.restore()}
function at(f){var want=f*total;for(var i=0;i<seg.length;i++){if(want<=seg[i]){var u=seg[i]?want/seg[i]:0;return{x:pts[i].x+(pts[i+1].x-pts[i].x)*u,y:pts[i].y+(pts[i+1].y-pts[i].y)*u,i:i}}want-=seg[i]}return{x:pts[pts.length-1].x,y:pts[pts.length-1].y,i:seg.length}}
var DIR={en:['north','northeast','east','southeast','south','southwest','west','northwest'],th:['ทิศเหนือ','ทิศตะวันออกเฉียงเหนือ','ทิศตะวันออก','ทิศตะวันออกเฉียงใต้','ทิศใต้','ทิศตะวันตกเฉียงใต้','ทิศตะวันตก','ทิศตะวันตกเฉียงเหนือ']};
function dir(az){return DIR[lang][Math.round(az/45)%8]}
function say(){var el=document.getElementById('skynow');if(!el||!S)return;
  var tm='';if(!here.noclock)try{tm=now().toLocaleTimeString(lang==='th'?'th-TH':'en-US',{hour:'numeric',minute:'2-digit'})}catch(e){}
  var sa=Math.round(S.sun.alt),ma=Math.round(S.moon.alt),f=Math.round(S.frac*100),out;
  if(lang==='th')out=['ท้องฟ้าเหนือ'+here.name+(tm?' '+tm:''),
    Math.abs(S.sun.alt)<1?'ดวงอาทิตย์อยู่ที่ขอบฟ้า '+dir(S.sun.az):sa>0?'ดวงอาทิตย์สูง '+sa+'° '+dir(S.sun.az):'ดวงอาทิตย์อยู่ใต้ขอบฟ้า '+(-sa)+'°',
    Math.abs(S.moon.alt)<1?'พระจันทร์สว่าง '+f+'% อยู่ที่ขอบฟ้า '+dir(S.moon.az):ma>0?'พระจันทร์สว่าง '+f+'% สูง '+ma+'° '+dir(S.moon.az):'พระจันทร์สว่าง '+f+'% อยู่ใต้ขอบฟ้า'];
  else out=['The sky over '+here.name+(tm?', '+tm:''),
    Math.abs(S.sun.alt)<1?'sun on the horizon in the '+dir(S.sun.az):sa>0?'sun '+sa+'° up in the '+dir(S.sun.az):'sun '+(-sa)+'° below the horizon',
    Math.abs(S.moon.alt)<1?'moon '+f+'% lit, on the horizon in the '+dir(S.moon.az):ma>0?'moon '+f+'% lit, '+ma+'° up in the '+dir(S.moon.az):'moon '+f+'% lit, below the horizon'];
  el.textContent=out.join(' · ')}
function frame(ts){
  if(t0===null)t0=ts;var t=(ts-t0)/1000;
  if(!S||Date.now()-lastS>30000){S=sky(now(),here.lat,here.lon);lastS=Date.now();say()}
  var sa=S.sun.alt,c=tint(sa),g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,c[0]);g.addColorStop(1,c[1]);cx.fillStyle=g;cx.fillRect(0,0,W,H);
  var dark=Math.max(0,Math.min(1,(-sa-2)/10)),i;
  if(dark>0)for(i=0;i<stars.length;i++){var s=stars[i],a=dark*(still?0.7:0.45+0.45*sin(t*s.s+s.p));cx.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';cx.fillRect(s.x,s.y,s.r,s.r)}
  var mp=place(S.moon),sp=place(S.sun);
  if(mp&&S.moon.alt>-6)drawMoon(mp,S.frac,S.limb,sa>0);
  if(sp&&sa>-6)drawSun(sp,sa);
  if(!still&&dark>0.6){if(!shoot&&Math.random()<0.004)shoot={x:Math.random()*W*0.7,y:Math.random()*H*0.35,a:0};
    if(shoot){shoot.a+=0.03;var L=90;cx.strokeStyle='rgba(255,255,255,'+(1-shoot.a).toFixed(2)+')';cx.lineWidth=1.2;cx.beginPath();cx.moveTo(shoot.x+shoot.a*260,shoot.y+shoot.a*120);cx.lineTo(shoot.x+shoot.a*260-L,shoot.y+shoot.a*120-L*0.46);cx.stroke();if(shoot.a>=1)shoot=null}}
  cx.fillStyle=mix('#6b5a4a','#08061a',Math.min(1,dark*0.6+0.4));cx.beginPath();cx.moveTo(0,H);for(var x=0;x<=W;x+=8){cx.lineTo(x,HZ+6-14*sin(x*0.013)-9*sin(x*0.041+1)-5*sin(x*0.11))}cx.lineTo(W,H);cx.fill();
  var draw=still?1:Math.min(1,t/4),end=at(draw),day=sa>4;if(draw>=1)end.i=pts.length-1;
  cx.lineCap='round';cx.lineJoin='round';cx.shadowColor='rgba(255,209,102,.9)';cx.shadowBlur=12;cx.strokeStyle=day?'rgba(255,200,80,.95)':'rgba(255,214,120,.85)';cx.lineWidth=day?2.2:1.6;
  cx.beginPath();cx.moveTo(pts[0].x,pts[0].y);for(i=1;i<=end.i&&i<pts.length;i++)cx.lineTo(pts[i].x,pts[i].y);cx.lineTo(end.x,end.y);cx.stroke();cx.shadowBlur=0;
  for(i=0;i<pts.length&&i<=end.i;i++){var q=pts[i],tw=still?1:0.75+0.25*sin(t*2+i);
    cx.fillStyle='rgba(255,240,200,'+tw.toFixed(2)+')';cx.beginPath();cx.arc(q.x,q.y,q.big?3.2:1.8,0,7);cx.fill();
    if(q.l&&W>520){cx.font='600 12px "Avenir Next",Avenir,"Segoe UI","Noto Sans Thai",Thonburi,system-ui,sans-serif';cx.fillStyle=day?'rgba(20,24,60,.85)':'rgba(236,226,255,.82)';cx.fillText(q.l,q.x+8,q.y+4)}}
  if(draw>=1&&!still){var w=at(((t-4)/60)%1),gl=cx.createRadialGradient(w.x,w.y,0,w.x,w.y,14);gl.addColorStop(0,'rgba(255,250,230,1)');gl.addColorStop(1,'rgba(255,220,140,0)');cx.fillStyle=gl;cx.beginPath();cx.arc(w.x,w.y,14,0,7);cx.fill()}
  document.documentElement.classList.toggle('sky-day',day);
  if(!still)requestAnimationFrame(frame);
}
var btn=document.getElementById('here');
if(btn&&navigator.geolocation)btn.addEventListener('click',function(){btn.disabled=true;
  navigator.geolocation.getCurrentPosition(function(p){here={lat:p.coords.latitude,lon:p.coords.longitude,name:lang==='th'?'ตำแหน่งของคุณ':'where you are'};S=null;btn.hidden=true;if(still)requestAnimationFrame(frame)},
  function(){btn.disabled=false},{maximumAge:6e5,timeout:15000})});
else if(btn)btn.hidden=true;
size();addEventListener('resize',function(){size();if(still)requestAnimationFrame(frame)});
requestAnimationFrame(frame);
if(still)setInterval(function(){S=null;requestAnimationFrame(frame)},60000);
})();
