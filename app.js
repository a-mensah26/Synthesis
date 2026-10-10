'use strict';
/* Magic Ring: plain JavaScript, no libraries. photos.js must be loaded first (it defines PHOTOS). */

/* ===== small helpers ===== */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const gh = n => 'GH₵ ' + n;
const icon = n => '<svg class="ico" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const none = text => '<div class="empty" style="grid-column:1/-1">' + text + '</div>';
const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
const timeAgo = ts => {
  const m = Math.round((Date.now() - ts) / 60000);
  return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago';
};

/* a photo if we have one, otherwise a plain coloured block */
function pic(key, alt, hue, cls) {
  if (PHOTOS[key]) return '<div class="art ph ' + (cls || '') + '"><img src="' + PHOTOS[key] + '" alt="' + esc(alt) + '"></div>';
  return '<div class="art ' + (cls || '') + '" style="--h:' + hue + '"></div>';
}

/* ===== saved data (kept in this browser) ===== */
let S = { me: '', seeded: false, projects: [], posts: [], userPatterns: [], cart: {}, purchased: [], regs: [] };
try { Object.assign(S, JSON.parse(localStorage.getItem('magic-ring-v2') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('magic-ring-v2', JSON.stringify(S)); } catch (e) {} };
const who = () => S.me.trim() || 'Guest crocheter';

/* ===== messages and pop-ups ===== */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2500);
}
function openDlg(id) { const d = $('#' + id); d.showModal ? d.showModal() : d.setAttribute('open', ''); }
function closeDlg(id) { const d = $('#' + id); d.close ? d.close() : d.removeAttribute('open'); }

/* ===== pages ===== */
const pages = { home: null, patterns: showPatterns, projects: showProjects, learn: showLearn, kit: showKit, shop: showShop, community: showCommunity, market: showMarket };
function show(name) {
  if (!has(pages, name)) name = 'home';
  $$('.view').forEach(v => { v.hidden = v.dataset.view !== name; });
  $$('.tabs [data-go]').forEach(t => t.classList.toggle('on', t.dataset.go === name));
  try { history.replaceState(null, '', '#' + name); } catch (e) {}   /* some browsers block this */
  if (pages[name]) pages[name]();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

/* ===== sample content ===== */
const DESIGNERS = { ama: 'Ama Serwaa', kofi: 'Kofi Mensah', efua: 'Efua Quansah', naledi: 'Naledi Dube' };

/* category: [label, types]. Searching a category word with several types asks which type you want. */
const CATS = {
  bag: ['bags', ['tote', 'side bag']], hat: ['hats', ['beanie', 'bucket hat', 'beret']],
  blanket: ['blankets', ['granny square', 'baby blanket', 'throw']], toy: ['toys', ['bear', 'bunny', 'octopus']],
  top: ['tops', ['crop top', 'cardigan', 'tank']], scarf: ['scarves', []], home: ['home and decor', ['plant cover', 'coaster']]
};
const ALIAS = { bags: 'bag', purse: 'bag', handbag: 'bag', hats: 'hat', cap: 'hat', blankets: 'blanket', afghan: 'blanket', toys: 'toy', amigurumi: 'toy', plush: 'toy', doll: 'toy', tops: 'top', shirt: 'top', sweater: 'top', jumper: 'top', scarves: 'scarf', decor: 'home', homeware: 'home' };

/* id, name, category, type, designer, level, hours, yarn, hook mm, price (0 = free), colour, description */
const PATTERNS = [
  ['mesh-tote', 'Mesh Beach Tote', 'bag', 'tote', 'ama', 'Intermediate', 8, 'Cotton cord', 6, 25, 190, 'Open mesh walls and flat woven handles that carry wet towels without sagging.'],
  ['granny-cross', 'Granny Square Crossbody', 'bag', 'side bag', 'naledi', 'Intermediate', 9, 'Worsted cotton', 4.5, 35, 45, 'Six granny squares joined into a roomy side bag with an adjustable strap.'],
  ['ribbed-beanie', 'Ribbed Beanie', 'hat', 'beanie', 'kofi', 'Beginner', 3, 'Worsted acrylic', 5.5, 0, 350, 'Stretchy ribbing worked in the back loop, with sizes from child to adult.'],
  ['bucket-hat', 'Sunny Bucket Hat', 'hat', 'bucket hat', 'ama', 'Intermediate', 5, 'Cotton DK', 4, 28, 50, 'A summer hat with a firm crown and a wide shade brim.'],
  ['cloche-beret', 'Cloche Beret', 'hat', 'beret', 'kofi', 'Intermediate', 5, 'DK wool', 4.5, 25, 300, 'A flat-topped beret shaped with even increases and a ribbed band.'],
  ['sunburst-granny', 'Sunburst Granny Throw', 'blanket', 'granny square', 'naledi', 'Intermediate', 45, 'DK cotton', 4, 30, 40, 'Bright sunburst centres on every square, framed in a calm neutral.'],
  ['cloud-cot', 'Cloud Stitch Cot Blanket', 'blanket', 'baby blanket', 'efua', 'Beginner', 20, 'Soft baby DK', 4.5, 22, 200, 'A squishy cot blanket in an easy two-row repeat.'],
  ['chunky-throw', 'Chunky Sofa Throw', 'blanket', 'throw', 'kofi', 'Beginner', 14, 'Super bulky', 10, 18, 165, 'A fast, heavy throw worked with a large hook and chunky yarn.'],
  ['little-bear', 'Little Bear', 'toy', 'bear', 'efua', 'Intermediate', 6, 'Cotton DK', 3.5, 0, 25, 'A bear with a jointed look, sewn-on ears and safety eyes.'],
  ['floppy-bunny', 'Floppy-Ear Bunny', 'toy', 'bunny', 'efua', 'Intermediate', 7, 'Cotton DK', 3.5, 25, 340, 'A soft bunny with long ears, a round tail and a tiny scarf.'],
  ['pocket-octopus', 'Pocket Octopus', 'toy', 'octopus', 'efua', 'Beginner', 2, 'Cotton DK', 3.5, 0, 185, 'A palm-sized octopus that teaches spirals, increases and tentacles.'],
  ['crop-top', 'Summer Crop Top', 'top', 'crop top', 'kofi', 'Intermediate', 12, 'Cotton DK', 4, 35, 12, 'A fitted crop top with shoulder straps and a lacy hem.'],
  ['cosy-cardigan', 'Cosy Cardigan', 'top', 'cardigan', 'kofi', 'Advanced', 35, 'DK wool blend', 4.5, 45, 280, 'A top-down cardigan with raglan shaping and pockets, in sizes XS to 3XL.'],
  ['granny-tank', 'Granny Tank', 'top', 'tank', 'naledi', 'Intermediate', 14, 'Cotton DK', 4, 30, 50, 'A square-motif tank top with simple seaming and a flattering hem.'],
  ['moss-scarf', 'Moss Stitch Scarf', 'scarf', 'scarf', 'kofi', 'Beginner', 5, 'Worsted wool blend', 5.5, 0, 215, 'A reversible scarf in a two-stitch repeat that never gets boring.'],
  ['plant-cosy', 'Plant Pot Cosy', 'home', 'plant cover', 'ama', 'Beginner', 2, 'Worsted cotton', 5, 0, 130, 'A snug cover for a small plant pot, adjustable to any size.'],
  ['coaster-set', 'Round Coaster Set', 'home', 'coaster', 'efua', 'Beginner', 2, 'Worsted cotton', 4, 0, 355, 'A set of four flat coasters, ideal for practising circles.']
].map(a => ({ id: a[0], name: a[1], cat: a[2], type: a[3], by: DESIGNERS[a[4]], level: a[5], hours: a[6], yarn: a[7], hook: a[8], price: a[9], hue: a[10], text: a[11] }));

const STEPS = [
  'Make a gauge swatch with the hook size above and check it measures 10 × 10 cm.',
  'Start with a magic ring or a foundation chain, as the pattern says.',
  'Work the increases evenly, marking the first stitch of every round.',
  'Work even rounds or rows until the piece reaches the size you want.',
  'Add the shaping, edging or finishing details.',
  'Weave in the ends with a tapestry needle and block to size.'
];
const allPatterns = () => PATTERNS.concat(S.userPatterns);
const owns = p => p.price === 0 || p.user || S.purchased.includes(p.id);
const priceTag = p => p.price === 0 ? '<span class="tag free">Free</span>' : owns(p) ? '<span class="tag ok">Owned</span>' : '<span class="tag paid">' + gh(p.price) + '</span>';

/* ===== home ===== */
function setupHome() {
  $('#heroPic').innerHTML = '<img src="' + PHOTOS['sunburst-granny'] + '" alt="Colourful granny square throw">';
  $('#homePats').innerHTML = ['cosy-cardigan', 'floppy-bunny', 'ribbed-beanie', 'pocket-octopus'].map(id => {
    const p = PATTERNS.find(x => x.id === id);
    return '<button class="home-card" data-view-pat="' + p.id + '">' + pic(p.id, p.name, p.hue) + '<span><b>' + esc(p.name) + '</b><small class="muted">by ' + esc(p.by) + ' · ' + p.level + '</small></span></button>';
  }).join('');
}

/* ===== patterns: search, filters, details ===== */
let query = '', pick = null, level = 'all', cost = 'all';
const findCat = q => { q = q.trim().toLowerCase(); return has(CATS, q) ? q : has(ALIAS, q) ? ALIAS[q] : ''; };

function patternMatches(p) {
  const q = query.trim().toLowerCase(), c = findCat(q);
  if (!q) return true;
  if (c) return p.cat === c && (pick === null || pick === 'all' || p.type === pick);
  const text = (p.name + ' ' + p.cat + ' ' + p.type + ' ' + p.text + ' ' + p.yarn + ' ' + p.by).toLowerCase();
  return q.split(' ').every(w => text.includes(w));
}
function patternCard(p) {
  return '<article class="card">' + pic(p.id, p.name, p.hue) + '<div class="card-body">'
    + '<div class="row" style="gap:6px"><span class="tag">' + p.level + '</span>' + priceTag(p) + '</div>'
    + '<h3>' + esc(p.name) + '</h3>'
    + '<p class="meta"><span>by ' + esc(p.by) + '</span>' + (p.hours ? '<span>' + p.hours + ' h</span>' : '') + '<span>' + p.hook + ' mm</span></p>'
    + '<p class="muted small">' + esc(p.text) + '</p>'
    + '<div class="row push"><button class="btn small primary" data-view-pat="' + p.id + '">View pattern</button><button class="btn small" data-track-pat="' + p.id + '">Track project</button></div>'
    + '</div></article>';
}
function showPatterns() {
  const cat = findCat(query), types = cat ? CATS[cat][1] : [];
  if (types.length && pick === null) {          /* ask which type */
    $('#patRefine').innerHTML = '<div class="refine"><h3>Which kind of ' + (cat === 'home' ? 'home item' : cat) + '?</h3><div class="chips">'
      + types.map(t => '<button class="chip" data-ref="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + ' (' + allPatterns().filter(p => p.type === t).length + ')</button>').join('')
      + '<button class="chip" data-ref="all">Show all ' + CATS[cat][0] + '</button></div></div>';
    $('#patGrid').innerHTML = '';
    $('#patCount').textContent = 'Pick a type to see matching patterns.';
    return;
  }
  $('#patRefine').innerHTML = types.length ? '<div class="row" style="margin-top:14px;gap:8px"><span class="muted">Showing ' + CATS[cat][0] + ': <b>' + (pick === 'all' ? 'all types' : pick) + '</b></span><button class="btn small ghost" data-ref="ask">Change type</button></div>' : '';
  const list = allPatterns().filter(patternMatches)
    .filter(p => level === 'all' || p.level === level)
    .filter(p => cost === 'all' || (cost === 'free') === (p.price === 0));
  $('#patCount').textContent = plural(list.length, 'pattern');
  $('#patGrid').innerHTML = list.length ? list.map(patternCard).join('') : none('Nothing matches. Try “bag”, “beanie” or “blanket”, or change the filters.');
}
function pressed(boxSelector, attr, value) {
  $$(boxSelector + ' [' + attr + ']').forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute(attr) === value)));
}
function openPattern(id) {
  const p = allPatterns().find(x => x.id === id);
  const steps = owns(p) ? STEPS : STEPS.slice(0, 2);
  $('#patBody').innerHTML = '<div class="dlg-bar"><div class="row" style="gap:6px"><span class="tag">' + p.level + '</span>' + priceTag(p) + '</div><button class="btn small ghost" data-close="patDlg">Close</button></div>'
    + pic(p.id, p.name, p.hue, 'short')
    + '<div><h2>' + esc(p.name) + '</h2><p class="muted">by ' + esc(p.by) + (p.hours ? ' · about ' + p.hours + ' hours' : '') + ' · ' + esc(p.yarn) + ' · ' + p.hook + ' mm hook</p></div>'
    + '<p>' + esc(p.text) + '</p>'
    + '<div class="form-grid"><div><h4>Materials</h4><ul style="margin:6px 0 0;padding-left:1.2rem"><li>Yarn: ' + esc(p.yarn) + '</li><li>Hook: ' + p.hook + ' mm</li><li>Stitch markers</li><li>Tapestry needle</li></ul></div>'
    + '<div><h4>Gauge</h4><p class="muted" style="margin-top:6px">Make a 10 × 10 cm swatch with the ' + p.hook + ' mm hook. Too small: go up a hook size. Too big: go down one.</p></div></div>'
    + '<div><h4>Overview of the steps</h4><ol class="steps" style="margin-top:8px">' + steps.map(s => '<li>' + s + '</li>').join('') + '</ol></div>'
    + (owns(p) ? '' : '<div class="locked"><b>' + (STEPS.length - 2) + ' more steps unlock after purchase.</b><button class="btn primary small" data-add-pat="' + p.id + '">Add to cart for ' + gh(p.price) + '</button></div>')
    + '<div class="row"><button class="btn primary" data-track-pat="' + p.id + '">Start tracking this project</button></div>';
  openDlg('patDlg');
}

/* ===== projects and counters ===== */
let armedDelete = '';
function counter(j, label, key, goalKey) {
  const val = j[key], goal = j[goalKey], pct = goal ? Math.min(100, Math.round(val / goal * 100)) : 0;
  return '<div class="ctr-block"><div class="ctr-top"><span class="lbl">' + label + '</span>'
    + '<label class="goal">Goal <input type="number" min="0" max="999" value="' + goal + '" data-goal="' + goalKey + '" aria-label="' + label + ' goal"></label></div>'
    + '<div class="ctr"><button class="btn ctr-btn" data-act="' + key + '-" aria-label="Remove one">&minus;</button><output class="ctr-n">' + val + '</output>'
    + '<button class="btn primary ctr-btn" data-act="' + key + '+" aria-label="Add one">+</button></div>'
    + '<div class="bar"><i style="width:' + pct + '%"></i></div>'
    + '<div class="ctr-top"><span class="small muted">' + (goal ? val + ' of ' + goal + ' (' + pct + '%)' : 'Set a goal to see progress') + '</span><button class="btn small ghost" data-act="' + key + '0">Reset</button></div></div>';
}
function projectCard(j) {
  const pat = allPatterns().find(p => p.id === j.pid);
  return '<article class="card proj" data-id="' + j.id + '">'
    + '<div class="proj-head"><div><h3>' + esc(j.name) + '</h3><p class="muted small">' + (pat ? 'Pattern: ' + esc(pat.name) + ' · ' : '') + 'Updated ' + timeAgo(j.ts) + '</p></div>' + (j.example ? '<span class="tag warn">Example</span>' : '') + '</div>'
    + counter(j, 'Rows', 'rows', 'rowGoal') + counter(j, 'Stitches in this row', 'st', 'stGoal')
    + (j.stGoal && j.st >= j.stGoal ? '<p class="done-note">Row complete. Add a row to start the next one.</p>' : '')
    + '<label class="toggle"><input type="checkbox" data-auto ' + (j.auto ? 'checked' : '') + '> Reset stitches to 0 when I add a row</label>'
    + '<div class="field"><label>Notes</label><textarea aria-label="Notes" data-notes maxlength="500" placeholder="Hook, yarn, where you stopped">' + esc(j.notes) + '</textarea></div>'
    + '<div><button class="btn small danger" data-act="del">' + (armedDelete === j.id ? 'Tap again to delete' : 'Delete project') + '</button></div></article>';
}
function showProjects() {
  $('#projList').innerHTML = S.projects.length ? S.projects.map(projectCard).join('') : none('No projects yet. Start one from a pattern, or press New project.');
}
function addProject(name, pid, rowGoal, stGoal) {
  S.projects.unshift({ id: newId(), name: name, pid: pid, rows: 0, rowGoal: rowGoal, st: 0, stGoal: stGoal, auto: true, notes: '', ts: Date.now() });
  save();
}
const projectOf = el => S.projects.find(j => j.id === el.closest('[data-id]').dataset.id);
function projectClick(b) {
  const j = projectOf(b), act = b.dataset.act;
  if (act === 'del') {
    if (armedDelete === j.id) { S.projects = S.projects.filter(x => x !== j); armedDelete = ''; toast('Project deleted'); }
    else armedDelete = j.id;
  } else {
    const key = act.slice(0, -1), op = act.slice(-1);
    if (op === '+') { j[key] = Math.min(999, j[key] + 1); if (key === 'rows' && j.auto) j.st = 0; }
    if (op === '-') j[key] = Math.max(0, j[key] - 1);
    if (op === '0') j[key] = 0;
    j.ts = Date.now();
  }
  save();
  showProjects();
  const again = $('[data-id="' + j.id + '"] [data-act="' + act + '"]');
  if (again) again.focus();
}

/* ===== learn: lessons and live sessions ===== */
const LESSONS = [
  ['Hold the hook and yarn', 'Beginner', 8, ['Hold the hook like a pencil or a knife, whichever feels steadier.', 'Wrap the yarn over your other hand, under the last two fingers and over the index finger.', 'Use your thumb and middle finger to hold the work close to the hook.', 'Keep your grip loose. Tight hands make tight stitches.']],
  ['Slip knot and chain stitch', 'Beginner', 10, ['Make a slip knot and place it on the hook.', 'Wrap the yarn over the hook (a yarn over).', 'Pull the yarn through the loop on the hook. That is one chain.', 'Repeat to make a row of even chains and count them as you go.']],
  ['Single crochet', 'Beginner', 12, ['Insert the hook into the second chain from the hook.', 'Yarn over and pull up a loop. You now have two loops on the hook.', 'Yarn over and pull through both loops.', 'Repeat in each chain, then chain 1 and turn.']],
  ['Double crochet', 'Beginner', 14, ['Yarn over, then insert the hook into the fourth chain from the hook.', 'Yarn over and pull up a loop. You now have three loops on the hook.', 'Yarn over and pull through two loops, then again through the last two.', 'Chain 3 at the end of each row to count as the first stitch.']],
  ['Magic ring', 'Beginner', 9, ['Wrap the yarn twice around two fingers to form a loop.', 'Insert the hook through the loop and pull up the working yarn.', 'Chain 1, then work your first round of stitches into the ring.', 'Pull the tail to close the centre tightly, then weave it in.']],
  ['Read a pattern and its abbreviations', 'Beginner', 15, ['Read the materials list and gauge before you start.', 'Learn the abbreviations used, such as ch, sc, dc and st.', 'Brackets and asterisks mean repeat the instructions between them.', 'The stitch count at the end of a row tells you whether you are on track.']],
  ['Join granny squares', 'Intermediate', 16, ['Lay out the squares and decide the order.', 'Choose a join: slip stitch, single crochet or join-as-you-go.', 'Work along the edges through the loops of both squares.', 'Keep your tension the same as in the squares so the seam lies flat.']],
  ['Invisible decrease', 'Intermediate', 8, ['Insert the hook into the front loop of the next stitch, then the one after.', 'Yarn over and pull through both front loops.', 'Yarn over and pull through the two loops on the hook.', 'Repeat for each decrease. The shaping hides inside the fabric.']],
  ['Change colour cleanly', 'Intermediate', 11, ['Work the last stitch of the old colour until two loops remain.', 'Drop the old colour and pull the new colour through.', 'Carry the unused yarn along the top of the row, or cut it and weave it in later.', 'Keep both tails on the wrong side.']],
  ['Block a finished piece', 'Intermediate', 10, ['Wash the piece gently and press out the water in a towel.', 'Pin it flat on a blocking mat with T-pins, shaped to the measurements.', 'Let it dry fully before unpinning.', 'Blocking evens out stitches and opens up lace.']]
];
/* title, designer, weekday (0 = Sunday), hour, minute, minutes long, level, places, places taken, description */
const SESSIONS = [
  ['Granny square from scratch', 'naledi', 6, 15, 0, 90, 'Beginner', 12, 8, 'Make your first square together and fix the common wobbly corners.'],
  ['Magic ring and amigurumi basics', 'efua', 0, 16, 0, 60, 'Beginner', 10, 6, 'Start a small toy from a magic ring and keep your rounds even.'],
  ['Tote bag clinic: handles and lining', 'ama', 3, 18, 30, 60, 'Intermediate', 15, 9, 'Bring your tote in progress and get help with handles, bases and lining.'],
  ['Reading garment patterns and sizing', 'kofi', 4, 19, 0, 75, 'Intermediate', 12, 4, 'Measure yourself, read a size chart and choose what to adjust.']
];
let lessonLevel = 'all', regIndex = -1;
function nextDate(s) {
  const d = new Date();
  d.setHours(s[3], s[4], 0, 0);
  while (d.getDay() !== s[2] || d <= new Date()) d.setDate(d.getDate() + 1);
  return d;
}
const dayText = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const timeText = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const isRegistered = i => S.regs.some(r => r.session === i);

function showLearn() {
  const lessons = LESSONS.filter(l => lessonLevel === 'all' || l[1] === lessonLevel);
  $('#lessonGrid').innerHTML = lessons.map(l => '<article class="card"><div class="card-body">'
    + '<div class="row" style="gap:6px"><span class="tag">' + l[1] + '</span><span class="tag">' + l[2] + ' min</span></div><h3>' + l[0] + '</h3>'
    + '<details class="lesson"><summary>Read the steps</summary><ol>' + l[3].map(s => '<li>' + s + '</li>').join('') + '</ol></details>'
    + '<div class="push"><a class="btn small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=' + encodeURIComponent('how to ' + l[0] + ' crochet') + '">' + icon('play') + 'Find video tutorials</a></div>'
    + '</div></article>').join('');
  $('#sessionList').innerHTML = SESSIONS.map((s, i) => {
    const when = nextDate(s), left = s[7] - s[8] - S.regs.filter(r => r.session === i).length;
    return '<article class="card session"><div class="when"><b>' + when.getDate() + '</b><span>' + when.toLocaleDateString('en-GB', { weekday: 'short', month: 'short' }) + '</span></div>'
      + '<div style="min-width:0"><div class="row" style="gap:6px;margin-bottom:6px"><span class="tag">' + s[6] + '</span>' + (left > 0 ? '<span class="tag ok">' + left + ' spots left</span>' : '<span class="tag warn">Full</span>') + '</div>'
      + '<h3>' + s[0] + '</h3><p class="meta" style="margin-block:4px"><span>with ' + DESIGNERS[s[1]] + '</span><span>' + timeText(when) + '</span><span>' + s[5] + ' min</span></p><p class="muted small">' + s[9] + '</p></div>'
      + '<div class="acts row">' + (isRegistered(i) ? '<span class="tag ok">You are registered</span><button class="btn small ghost" data-unreg="' + i + '">Cancel</button>'
        : '<button class="btn small primary" data-reg="' + i + '"' + (left > 0 ? '' : ' disabled') + '>Register for this session</button>') + '</div></article>';
  }).join('');
  $('#myRegs').innerHTML = S.regs.length ? '<div class="panel"><b>You are registered for ' + plural(S.regs.length, 'session') + '.</b></div>' : '';
}

/* ===== starter kit: size tables and hook finder ===== */
const HOOKS = [['2.25', 'B-1', 'Lace, fine cotton'], ['2.75', 'C-2', 'Fingering'], ['3.25', 'D-3', 'Fingering, sport'], ['3.5', 'E-4', 'Sport, small toys'], ['3.75', 'F-5', 'Sport'], ['4.0', 'G-6', 'Sport, DK'], ['4.5', '7', 'DK'], ['5.0', 'H-8', 'DK, worsted (good first hook)'], ['5.5', 'I-9', 'Worsted (good first hook)'], ['6.0', 'J-10', 'Worsted'], ['6.5', 'K-10.5', 'Worsted, bulky'], ['8.0', 'L-11', 'Bulky'], ['9.0', 'M/N-13', 'Bulky, super bulky'], ['10.0', 'N/P-15', 'Super bulky']];
const YARNS = [
  ['Lace (0)', '1.6 to 2.25 mm', 'Doilies and fine shawls.'],
  ['Super fine / fingering (1)', '2.25 to 3.5 mm', 'Socks, light shawls, baby wear.'],
  ['Fine / sport (2)', '3.5 to 4.5 mm', 'Light garments and toys.'],
  ['Light / DK (3)', '4.5 to 5.5 mm', 'Garments, amigurumi, bags.'],
  ['Medium / worsted (4)', '5.5 to 6.5 mm', 'Blankets, hats, bags and most beginner projects.'],
  ['Bulky (5)', '6.5 to 9 mm', 'Quick scarves, throws and hats.'],
  ['Super bulky (6)', '9 to 15 mm', 'Chunky throws and rugs.']
];
function showYarn() {
  const y = YARNS[$('#yarnPick').value];
  $('#yarnOut').innerHTML = '<p><b>Typical hook:</b> <span class="mono">' + y[1] + '</span></p><p class="muted" style="margin-top:4px"><b>Good for:</b> ' + y[2] + '</p>';
}
function showKit() {
  $('#hookTable').innerHTML = '<thead><tr><th>Metric</th><th>US size (varies by brand)</th><th>Suits yarn</th></tr></thead><tbody>'
    + HOOKS.map(h => '<tr><td class="mono">' + h[0] + ' mm</td><td class="mono">' + h[1] + '</td><td>' + h[2] + '</td></tr>').join('') + '</tbody>';
  $('#yarnTable').innerHTML = '<thead><tr><th>Yarn weight</th><th>Typical hook</th><th>Good for</th></tr></thead><tbody>'
    + YARNS.map(y => '<tr><td>' + y[0] + '</td><td class="mono">' + y[1] + '</td><td>' + y[2] + '</td></tr>').join('') + '</tbody>';
  $('#yarnPick').innerHTML = YARNS.map((y, i) => '<option value="' + i + '"' + (i === 4 ? ' selected' : '') + '>' + y[0] + '</option>').join('');
  showYarn();
}

/* ===== tool shop and cart (sample prices) ===== */
/* id, name, category, price, description */
const PRODUCTS = [
  ['hook-5', 'Aluminium hook, 5.0 mm', 'Hooks', 18, 'Smooth, light and the size most worsted-yarn beginner patterns ask for.'],
  ['hook-bamboo', 'Bamboo hook, 5.5 mm', 'Hooks', 22, 'Warm and grippy, so slippery yarn slides less.'],
  ['hook-set', 'Ergonomic hook set, 2.5 to 6.0 mm', 'Hooks', 145, 'Eight soft-grip hooks in a roll. Worth buying once you know which sizes you use.'],
  ['yarn-acrylic', 'Acrylic worsted yarn, 100 g', 'Yarn', 28, 'Smooth, in a light colour so stitches are easy to see. Machine washable.'],
  ['yarn-cotton', 'Cotton worsted yarn, 100 g', 'Yarn', 38, 'Firm and cool. The right choice for bags, coasters and plant covers.'],
  ['yarn-chunky', 'Chunky blanket yarn, 200 g', 'Yarn', 60, 'Soft chunky yarn for fast throws. Pair it with a 10 mm hook.'],
  ['scissors', 'Small embroidery scissors', 'Notions', 25, 'Sharp pointed blades with a cover. Fits in any project bag.'],
  ['needles', 'Tapestry needles, 6 sizes', 'Notions', 15, 'Blunt tips and large eyes for weaving in ends and joining pieces.'],
  ['markers', 'Locking stitch markers, 30 pack', 'Notions', 20, 'Clip into a stitch to mark the start of a round or a spot to return to.'],
  ['tape', 'Retractable measuring tape', 'Notions', 10, 'Checks gauge swatches and finished sizes.'],
  ['counter', 'Click row counter', 'Notions', 22, 'A small click counter that sits on your hook or finger.'],
  ['pins', 'Blocking T-pins, 100 pack', 'Notions', 30, 'Rust-proof pins that hold a piece to shape while it dries.'],
  ['mat', 'Interlocking blocking mat, 9 tiles', 'Notions', 85, 'Foam tiles you pin into, then fold away flat.'],
  ['eyes', 'Safety eyes, assorted sizes, 100 pcs', 'Notions', 28, 'Lock-washer eyes for amigurumi. Fit them before you stuff.'],
  ['fill', 'Polyester stuffing, 250 g', 'Notions', 24, 'Soft, washable filling for toys and cushions.'],
  ['projbag', 'Zip project bag', 'Storage', 45, 'Keeps yarn, hook and pattern together and the yarn clean.'],
  ['kit-start', 'Beginner kit: hook, 2 yarns, scissors, needles, markers', 'Kits', 99, 'Everything for your first project in one pack. Saves GH₵ 35 compared with buying the parts one by one.']
].map(a => ({ id: a[0], name: a[1], cat: a[2], price: a[3], text: a[4] }));
let shopCat = 'All', shopSort = 'feat';

function showShop() {
  $('#shopCats').innerHTML = ['All', 'Hooks', 'Yarn', 'Notions', 'Storage', 'Kits'].map(c => '<button class="chip" data-cat="' + c + '" aria-pressed="' + (c === shopCat) + '">' + c + '</button>').join('');
  const q = $('#shopQ').value.trim().toLowerCase();
  let list = PRODUCTS.filter(p => (shopCat === 'All' || p.cat === shopCat) && (p.name + ' ' + p.text + ' ' + p.cat).toLowerCase().includes(q));
  if (shopSort === 'lo') list.sort((a, b) => a.price - b.price);
  if (shopSort === 'hi') list.sort((a, b) => b.price - a.price);
  $('#shopCount').textContent = plural(list.length, 'product');
  $('#shopGrid').innerHTML = list.length ? list.map(p => '<article class="card">' + pic('tool-' + p.id, p.name, 30, 'prod') + '<div class="card-body">'
    + '<div class="row"><span class="tag">' + p.cat + '</span></div><h3>' + esc(p.name) + '</h3><p class="muted small">' + esc(p.text) + '</p>'
    + '<div class="row between push"><span class="price">' + gh(p.price) + '</span><button class="btn small primary" data-add="tool:' + p.id + '">Add to cart</button></div></div></article>').join('')
    : none('No products match that search.');
}

function cartLines() {
  const lines = [];
  Object.keys(S.cart).forEach(key => {
    const id = key.split(':')[1];
    if (key.startsWith('tool:')) {
      const p = PRODUCTS.find(x => x.id === id);
      if (p) lines.push({ key: key, name: p.name, price: p.price, qty: S.cart[key] });
    } else {
      const p = allPatterns().find(x => x.id === id);
      if (p) lines.push({ key: key, name: p.name + ' (digital pattern)', price: p.price, qty: 1, pattern: id });
    }
  });
  return lines;
}
const cartTotal = () => cartLines().reduce((sum, l) => sum + l.price * l.qty, 0);
const updateCartCount = () => { $('#cartCount').textContent = cartLines().reduce((sum, l) => sum + l.qty, 0); };

function addToCart(key) {
  if (key.startsWith('pat:')) {
    if (S.purchased.includes(key.slice(4))) return toast('You already own this pattern');
    if (S.cart[key]) return toast('This pattern is already in your cart');
    S.cart[key] = 1;
  } else {
    S.cart[key] = Math.min(20, (S.cart[key] || 0) + 1);
  }
  save(); updateCartCount(); toast('Added to cart');
}
function showCart() {
  const lines = cartLines();
  if (!lines.length) { $('#cartBody').innerHTML = '<div class="empty">Your cart is empty.<div style="margin-top:12px"><button class="btn small" data-go="shop">Browse the tool shop</button></div></div>'; return; }
  $('#cartBody').innerHTML = lines.map(l => '<div class="cart-line"><div style="min-width:0"><b>' + esc(l.name) + '</b><div class="muted small">' + gh(l.price) + '</div></div><div class="price">' + gh(l.price * l.qty) + '</div>'
    + (l.pattern ? '<span class="muted small">1 pattern</span>' : '<div class="qty"><button class="btn small ghost" data-qty="-1" data-key="' + l.key + '" aria-label="One fewer">&minus;</button><span class="mono">' + l.qty + '</span><button class="btn small ghost" data-qty="1" data-key="' + l.key + '" aria-label="One more">+</button></div>')
    + '<button class="btn small ghost" data-rm="' + l.key + '">Remove</button></div>').join('')
    + '<div class="row between" style="margin-block:14px"><b>Total</b><span class="price">' + gh(cartTotal()) + '</span></div>'
    + '<form id="coForm" class="stack"><div class="field"><label for="coName">Name</label><input id="coName" required maxlength="40" value="' + esc(S.me) + '"></div>'
    + '<div class="field"><label for="coContact">Phone or email</label><input id="coContact" required maxlength="80"></div>'
    + '<div class="field"><label for="coNote">Delivery note (tools only)</label><textarea id="coNote" maxlength="300" placeholder="Area, landmark, preferred time"></textarea></div>'
    + '<button class="btn primary" type="submit">Place order (prototype)</button><p class="hint">No payment is taken and nothing is shipped. A live shop connects a payment provider and a delivery process.</p></form>';
}
function placeOrder() {
  const lines = cartLines(), total = cartTotal(), ref = newId().slice(-6).toUpperCase();
  const gotPatterns = lines.some(l => l.pattern), gotTools = lines.some(l => !l.pattern);
  lines.forEach(l => { if (l.pattern && !S.purchased.includes(l.pattern)) S.purchased.push(l.pattern); });
  if (!S.me) S.me = $('#coName').value.trim();
  S.cart = {};
  save(); updateCartCount();
  $('#cartBody').innerHTML = '<div class="stack"><h3>Order ' + ref + ' saved</h3><p>Total ' + gh(total) + '. This is a prototype, so no payment was taken.</p>'
    + (gotPatterns ? '<p>Your patterns are unlocked. Open them from <b>Your purchases</b> in the Marketplace.</p>' : '')
    + (gotTools ? '<p class="muted">In a live shop, tools would be delivered using the details you entered.</p>' : '')
    + '<div class="row">' + (gotPatterns ? '<button class="btn primary" data-go="market">Open my purchases</button>' : '') + '<button class="btn" data-close="cartDlg">Keep browsing</button></div></div>';
}

/* ===== community ===== */
const openPosts = [];
function showCommunity() {
  $('#meName').value = S.me;
  const posts = S.posts.slice().sort((a, b) => b.ts - a.ts);
  $('#feed').innerHTML = posts.length ? posts.map(postCard).join('') : none('No posts yet. Share the first make.');
}
function postCard(p) {
  const open = openPosts.includes(p.id), src = p.img || PHOTOS[p.photo];
  return '<article class="card post" data-id="' + p.id + '">' + (src ? '<img class="photo" src="' + src + '" alt="' + esc(p.text.slice(0, 80)) + '">' : '<div class="art" style="--h:30"></div>')
    + '<div class="card-body"><div class="row between"><b>' + esc(p.by) + '</b><span class="muted small">' + timeAgo(p.ts) + '</span></div>'
    + '<div class="row" style="gap:6px"><span class="tag">' + esc(p.tag) + '</span>' + (p.sample ? '<span class="tag warn">Sample</span>' : '') + '</div>'
    + '<p>' + esc(p.text) + '</p>'
    + '<div class="post-acts"><button class="btn small" data-like aria-pressed="' + !!p.liked + '" aria-label="Like">' + icon('heart') + ' ' + p.likes + '</button>'
    + '<button class="btn small" data-cm aria-expanded="' + open + '" aria-label="Comments">' + icon('comment') + ' ' + p.comments.length + '</button>'
    + '<button class="btn small" data-share>' + icon('link') + ' Share</button></div>'
    + (open ? '<div class="comments">' + p.comments.map(c => '<p><b>' + esc(c.by) + '</b>' + esc(c.text) + '</p>').join('')
      + '<form class="comment-form" data-post="' + p.id + '"><input maxlength="200" placeholder="Add a comment" aria-label="Add a comment" required><button class="btn small primary" type="submit">Send</button></form></div>' : '')
    + '</div></article>';
}
/* shrink a chosen photo so it fits in browser storage */
function readImage(file, max) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height)), canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function newPost() {
  S.me = $('#meName').value.trim();
  const file = $('#postPhoto').files[0];
  let img = '';
  if (file) { try { img = await readImage(file, 900); } catch (e) { toast('The photo could not be read, so it was posted without it'); } }
  S.posts.unshift({ id: newId(), by: who(), text: $('#postCap').value.trim(), tag: $('#postTag').value, img: img, likes: 0, liked: false, ts: Date.now(), comments: [] });
  save();
  $('#postCap').value = ''; $('#postPhoto').value = ''; $('#postPrev').hidden = true;
  showCommunity(); toast('Posted to the community');
}
function postClick(b) {
  const p = S.posts.find(x => x.id === b.closest('[data-id]').dataset.id);
  if (b.matches('[data-like]')) { p.liked = !p.liked; p.likes += p.liked ? 1 : -1; }
  if (b.matches('[data-cm]')) { openPosts.includes(p.id) ? openPosts.splice(openPosts.indexOf(p.id), 1) : openPosts.push(p.id); }
  if (b.matches('[data-share]')) {
    const link = location.href.split('#')[0] + '#community';
    try { navigator.clipboard.writeText(link).then(() => toast('Link copied'), () => toast('Copy this link: ' + link)); }
    catch (e) { toast('Copy this link: ' + link); }
    return;
  }
  save(); showCommunity();
}

/* ===== marketplace ===== */
let mkSort = 'feat';
function marketCard(p, mine) {
  return '<article class="card">' + pic(p.id, p.name, p.hue) + '<div class="card-body">'
    + '<div class="row" style="gap:6px"><span class="tag">' + p.level + '</span>' + priceTag(p) + (mine ? '<span class="tag pink">Your listing</span>' : '') + '</div>'
    + '<h3>' + esc(p.name) + '</h3><p class="meta"><span>by ' + esc(p.by) + '</span><span>' + p.hook + ' mm</span><span>' + esc(p.yarn) + '</span></p><p class="muted small">' + esc(p.text) + '</p>'
    + '<div class="row push">'
    + (mine ? '<button class="btn small" data-view-pat="' + p.id + '">View</button><button class="btn small danger" data-unlist="' + p.id + '">Remove listing</button>'
      : owns(p) ? '<button class="btn small primary" data-view-pat="' + p.id + '">Open pattern</button>'
        : '<button class="btn small primary" data-add-pat="' + p.id + '">Add to cart</button><button class="btn small" data-view-pat="' + p.id + '">Preview</button>')
    + '</div></div></article>';
}
function showMarket() {
  const labels = Object.keys(CATS).map(k => '<option value="' + k + '">' + CATS[k][0].charAt(0).toUpperCase() + CATS[k][0].slice(1) + '</option>').join('');
  if (!$('#slCat').innerHTML) { $('#slCat').innerHTML = labels; $('#mkCat').innerHTML = '<option value="All">All categories</option>' + labels; }
  const q = $('#mkQ').value.trim().toLowerCase(), cat = $('#mkCat').value;
  const list = allPatterns().filter(p => p.price > 0 && (cat === 'All' || p.cat === cat) && (p.name + ' ' + p.type + ' ' + p.text + ' ' + p.by).toLowerCase().includes(q));
  if (mkSort === 'lo') list.sort((a, b) => a.price - b.price);
  if (mkSort === 'hi') list.sort((a, b) => b.price - a.price);
  $('#mkCount').textContent = plural(list.length, 'pattern') + ' for sale';
  $('#mkGrid').innerHTML = list.length ? list.map(p => marketCard(p, false)).join('') : none('No paid patterns match that search.');
  $('#mkMine').innerHTML = S.userPatterns.length ? S.userPatterns.map(p => marketCard(p, true)).join('') : none('You have not listed a pattern yet. Press Sell a pattern.');
  const bought = allPatterns().filter(p => S.purchased.includes(p.id));
  $('#mkBought').innerHTML = bought.length ? bought.map(p => marketCard(p, false)).join('') : none('Patterns you buy appear here, with the full instructions unlocked.');
}
function newListing() {
  const name = $('#slTitle').value.trim();
  S.userPatterns.unshift({ id: 'u-' + newId(), name: name, cat: $('#slCat').value, type: $('#slType').value.trim(), by: who(), level: $('#slLevel').value, hours: 0, yarn: $('#slYarn').value.trim(), hook: parseFloat($('#slHook').value) || 5, price: Math.max(5, Math.round(parseFloat($('#slPrice').value) || 5)), hue: name.length * 37 % 360, text: $('#slDesc').value.trim(), user: true });
  save();
  ['slTitle', 'slType', 'slYarn', 'slDesc'].forEach(id => { $('#' + id).value = ''; });
  $('#sellForm').hidden = true; showMarket(); toast('Listing published');
}

/* ===== clicks: one handler for every button on the page ===== */
document.addEventListener('click', e => {
  if (e.target.tagName === 'DIALOG') return closeDlg(e.target.id);      /* click outside a pop-up */
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.go) { $$('dialog[open]').forEach(x => x.close()); show(d.go); }
  else if (d.close) closeDlg(d.close);
  else if (d.viewPat) openPattern(d.viewPat);
  else if (d.trackPat) { const p = allPatterns().find(x => x.id === d.trackPat); addProject(p.name, p.id, 30, 40); closeDlg('patDlg'); toast('Added to Projects'); }
  else if (d.addPat) addToCart('pat:' + d.addPat);
  else if (d.add) addToCart(d.add);
  else if (d.ref) { pick = d.ref === 'ask' ? null : d.ref; showPatterns(); }
  else if (d.lv) { level = d.lv; pressed('.filters', 'data-lv', level); showPatterns(); }
  else if (d.cost) { cost = d.cost; pressed('.filters', 'data-cost', cost); showPatterns(); }
  else if (d.q) { query = d.q; $('#patQ').value = query; pick = null; showPatterns(); }
  else if (d.llv) { lessonLevel = d.llv; pressed('#lessonFilters', 'data-llv', lessonLevel); showLearn(); }
  else if (d.cat) { shopCat = d.cat; showShop(); }
  else if (d.act) projectClick(b);
  else if (d.reg) { regIndex = +d.reg; const s = SESSIONS[regIndex], when = nextDate(s); $('#regTitle').textContent = s[0]; $('#regWhen').textContent = dayText(when) + ' at ' + timeText(when) + ' with ' + DESIGNERS[s[1]]; $('#regName').value = S.me; openDlg('regDlg'); }
  else if (d.unreg) { S.regs = S.regs.filter(r => r.session !== +d.unreg); save(); showLearn(); toast('Registration cancelled'); }
  else if (d.qty) { const n = (S.cart[d.key] || 0) + +d.qty; if (n <= 0) delete S.cart[d.key]; else S.cart[d.key] = Math.min(20, n); save(); updateCartCount(); showCart(); }
  else if (d.rm) { delete S.cart[d.rm]; save(); updateCartCount(); showCart(); }
  else if (d.unlist) { S.userPatterns = S.userPatterns.filter(p => p.id !== d.unlist); delete S.cart['pat:' + d.unlist]; save(); updateCartCount(); showMarket(); toast('Listing removed'); }
  else if ('like' in d || 'cm' in d || 'share' in d) postClick(b);
  else if (b.id === 'cartBtn') { showCart(); openDlg('cartDlg'); }
  else if (b.id === 'newProjBtn') { $('#projForm').hidden = false; $('#pjName').focus(); }
  else if (b.id === 'pjCancel') $('#projForm').hidden = true;
  else if (b.id === 'sellBtn') { $('#sellForm').hidden = false; $('#slTitle').focus(); }
  else if (b.id === 'sellCancel') $('#sellForm').hidden = true;
});

/* ===== forms ===== */
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'patForm') { query = $('#patQ').value; pick = null; showPatterns(); }
  else if (f.id === 'projForm') { addProject($('#pjName').value.trim(), '', +$('#pjRows').value || 0, +$('#pjSts').value || 0); $('#pjName').value = ''; f.hidden = true; showProjects(); toast('Project created'); }
  else if (f.id === 'regForm') { if (!isRegistered(regIndex)) S.regs.push({ session: regIndex, name: $('#regName').value.trim(), email: $('#regEmail').value.trim() }); if (!S.me) S.me = $('#regName').value.trim(); save(); closeDlg('regDlg'); showLearn(); toast('You are registered'); }
  else if (f.id === 'coForm') { if (cartLines().length) placeOrder(); }
  else if (f.id === 'postForm') newPost();
  else if (f.id === 'sellForm') newListing();
  else if (f.dataset.post) {
    const p = S.posts.find(x => x.id === f.dataset.post), input = f.querySelector('input');
    p.comments.push({ by: who(), text: input.value.trim() });
    save(); showCommunity();
    $('[data-post="' + p.id + '"] input').focus();
  }
});

/* ===== typing and changing fields ===== */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'shopQ') showShop();
  if (t.id === 'mkQ') showMarket();
  if (t.matches('[data-notes]')) { projectOf(t).notes = t.value; save(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'shopSort') { shopSort = t.value; showShop(); }
  if (t.id === 'mkSort') { mkSort = t.value; showMarket(); }
  if (t.id === 'mkCat') showMarket();
  if (t.id === 'yarnPick') showYarn();
  if (t.id === 'postPhoto') {
    const file = t.files[0];
    if (file) readImage(file, 400).then(src => { $('#postPrev').src = src; $('#postPrev').hidden = false; }, () => toast('That file could not be read as an image'));
    else $('#postPrev').hidden = true;
  }
  if (t.matches('[data-goal]')) { const j = projectOf(t); j[t.dataset.goal] = Math.max(0, Math.min(999, +t.value || 0)); save(); showProjects(); }
  if (t.matches('[data-auto]')) { projectOf(t).auto = t.checked; save(); }
});

/* ===== start ===== */
if (!S.seeded) {
  const hour = 3600000, now = Date.now();
  S.projects.push({ id: 'ex-tote', name: 'Mesh Beach Tote (example)', pid: 'mesh-tote', rows: 12, rowGoal: 30, st: 18, stGoal: 48, auto: true, notes: 'Example project. Delete it any time.', example: true, ts: now });
  S.posts = [
    { id: 'p1', by: 'Akosua T.', text: 'First ombré handbag finished! Cotton blend and a 4.5 mm hook. Sewing on the flower was my favourite part.', tag: 'Finished make', photo: 'sunset-bag', likes: 14, liked: false, ts: now - 3 * hour, sample: true, comments: [{ by: 'Efua Quansah', text: 'The shape is great. A smaller hook near the handles will keep them firm.' }, { by: 'Yaw B.', text: 'Love the colours!' }] },
    { id: 'p2', by: 'Naledi D.', text: 'Blanket progress: 38 squares in and the palette is finally clicking.', tag: 'Work in progress', photo: 'sunburst-granny', likes: 23, liked: false, ts: now - 9 * hour, sample: true, comments: [] },
    { id: 'p3', by: 'Maame A.', text: 'An octopus for a baby shower, with a tiny friend on top. Each one takes about two hours now.', tag: 'Gift', photo: 'pocket-octopus', likes: 31, liked: false, ts: now - 26 * hour, sample: true, comments: [{ by: 'Esi P.', text: 'Adding these to my list!' }] },
    { id: 'p4', by: 'Kwesi O.', text: 'Slouchy beanie in blush and slate stripes. I took the brim up two rows after trying it on.', tag: 'Finished make', photo: 'slouchy-beanie', likes: 9, liked: false, ts: now - 50 * hour, sample: true, comments: [] },
    { id: 'p5', by: 'Esi P.', text: 'My very first project: a scarf with a few wobbly edges and a lot of pride.', tag: 'First project', photo: 'moss-scarf', likes: 42, liked: false, ts: now - 80 * hour, sample: true, comments: [] }
  ];
  S.seeded = true;
  save();
}
setupHome();
$('#patQuick').innerHTML = '<span class="lbl" style="align-self:center">Try:</span>' + ['bag', 'hat', 'blanket', 'toy', 'top', 'scarf'].map(q => '<button class="chip" data-q="' + q + '">' + q + '</button>').join('');
updateCartCount();
$('#meName').addEventListener('change', () => { S.me = $('#meName').value.trim(); save(); });
show(location.hash.slice(1));
