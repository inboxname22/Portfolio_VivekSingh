// Portfolio viewer/editor and VK AI voice. Client-side password gates are NOT secure authentication.
const ADMIN_PASSWORD = 'vk?26'; // Existing demo gate retained; public JavaScript is inspectable.
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'vivek-static-portfolio-v1';
const PROFILE_FIELDS = ['name','title','intro','summary','email','phone','location'];
let data, publishedData, unlocked = false, editingIndex = -1;

function isValidPortfolio(value) {
  return !!value &&
    PROFILE_FIELDS.every(key => typeof value[key] === 'string' && value[key].length <= 20000) &&
    Array.isArray(value.projects) && value.projects.length <= 200 &&
    value.projects.every(project => project && ['name','tech','description'].every(key => typeof project[key] === 'string' && project[key].length <= 20000));
}
function setStatus(message) { $('status').textContent = message; }
function showScreen(screenId) {
  ['entry','login','viewer','admin'].forEach(id => { $(id).hidden = id !== screenId; });
  setStatus('');
  window.scrollTo(0, 0);
}
function updateHero() {
  $('heroName').textContent = data.name;
  $('heroTitle').textContent = data.title;
  $('heroIntro').textContent = data.intro;
  $('heroLocation').textContent = data.location;
  renderFeaturedProjects();
}
function goHome() {
  stopVoice();
  unlocked = false;
  $('password').value = '';
  $('loginMessage').textContent = '';
  showScreen('entry');
  if (data) updateHero();
}
document.querySelectorAll('.home').forEach(button => button.addEventListener('click', goHome));

$('adminEntry').addEventListener('click', () => {
  stopVoice(); showScreen('login'); $('password').focus();
});
$('loginForm').addEventListener('submit', event => {
  event.preventDefault();
  if ($('password').value !== ADMIN_PASSWORD) {
    $('loginMessage').textContent = 'Incorrect password.'; return;
  }
  unlocked = true; $('password').value = '';
  PROFILE_FIELDS.forEach(key => { $(key).value = data[key]; });
  clearProjectForm(); renderProjectEditor(); showScreen('admin');
});
function requireEditor() {
  if (!unlocked) throw new Error('Open the editor first.');
}
function openViewer(initialTab = 'portfolio') {
  stopVoice();
  $('viewerName').textContent = data.name;
  $('viewerTitle').textContent = data.title;
  $('viewerSummary').textContent = data.summary;
  $('contact').replaceChildren();
  const location = document.createElement('span'); location.textContent = data.location;
  const email = document.createElement('a'); email.textContent = data.email; email.href = 'mailto:' + data.email;
  const phone = document.createElement('a'); phone.textContent = data.phone; phone.href = 'tel:' + data.phone.replace(/[^+0-9]/g, '');
  $('contact').append(location, email, phone);
  $('filter').replaceChildren();
  const all = document.createElement('option'); all.value = ''; all.textContent = 'All technologies'; $('filter').append(all);
  [...new Set(data.projects.flatMap(project => project.tech.split('·').map(item => item.trim()).filter(Boolean)))].sort().forEach(technology => {
    const option = document.createElement('option'); option.textContent = technology; option.value = technology; $('filter').append(option);
  });
  renderProjectCards(); switchTab(initialTab); showScreen('viewer');
}
$('userEntry').addEventListener('click', () => openViewer('portfolio'));
$('projectsEntry').addEventListener('click', () => openViewer('projects'));
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
function switchTab(tabId) {
  ['portfolio','projects','resume'].forEach(id => { $(id).hidden = id !== tabId; });
  document.querySelectorAll('[data-tab]').forEach(button => {
    const active = button.dataset.tab === tabId;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
  if (tabId === 'resume') $('pdfPreview').src = 'assets/resume.pdf';
}
function renderFeaturedProjects() {
  const container = $('featuredProjects'); if (!container || !data) return;
  container.replaceChildren();
  data.projects.slice(0, 4).forEach(project => {
    const card = document.createElement('article'); card.className = 'featured-item';
    const title = document.createElement('h3'); title.textContent = project.name;
    const tech = document.createElement('p'); tech.className = 'tech'; tech.textContent = project.tech;
    const description = document.createElement('p'); description.textContent = project.description;
    card.append(title, tech, description); container.append(card);
  });
}
function renderProjectCards() {
  const query = $('search').value.toLowerCase(), filter = $('filter').value;
  const projects = data.projects.filter(project =>
    (project.name + ' ' + project.tech + ' ' + project.description).toLowerCase().includes(query) &&
    (!filter || project.tech.split('·').map(item => item.trim()).includes(filter))
  );
  $('count').textContent = projects.length + ' projects found'; $('cards').replaceChildren();
  projects.forEach(project => {
    const card = document.createElement('article'); card.className = 'card';
    const title = document.createElement('h3'); title.textContent = project.name;
    const tech = document.createElement('p'); tech.textContent = project.tech; tech.className = 'tech';
    const description = document.createElement('p'); description.textContent = project.description;
    card.append(title, tech, description); $('cards').append(card);
  });
  if (!projects.length) $('cards').textContent = 'No matching projects.';
}
$('search').addEventListener('input', renderProjectCards);
$('filter').addEventListener('change', renderProjectCards);

function readProfileFields() {
  requireEditor();
  PROFILE_FIELDS.forEach(key => { data[key] = $(key).value.trim(); });
}
function clearProjectForm() {
  editingIndex = -1;
  ['projectName','projectTech','projectDescription'].forEach(id => { $(id).value = ''; });
  $('editHeading').textContent = 'Add project';
}
function renderProjectEditor() {
  $('projectList').replaceChildren();
  data.projects.forEach((project, index) => {
    const row = document.createElement('div'); row.className = 'row';
    const title = document.createElement('h4'); title.textContent = project.name;
    const actions = document.createElement('div'); actions.className = 'actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit';
    edit.addEventListener('click', () => {
      requireEditor(); editingIndex = index;
      $('projectName').value = project.name; $('projectTech').value = project.tech; $('projectDescription').value = project.description;
      $('editHeading').textContent = 'Edit project'; $('projectName').focus();
    });
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Delete';
    remove.addEventListener('click', () => {
      requireEditor();
      if (confirm('Delete "' + project.name + '" from the current draft?')) {
        data.projects.splice(index, 1); clearProjectForm(); renderProjectEditor(); renderFeaturedProjects();
        setStatus('Removed from current draft. Save or export JSON to keep the change.');
      }
    });
    actions.append(edit, remove); row.append(title, actions); $('projectList').append(row);
  });
}
$('cancel').addEventListener('click', clearProjectForm);
$('apply').addEventListener('click', () => {
  try {
    requireEditor();
    const project = {name:$('projectName').value.trim(), tech:$('projectTech').value.trim(), description:$('projectDescription').value.trim()};
    if (!project.name || !project.tech || !project.description) { setStatus('Complete all project fields.'); return; }
    if (editingIndex < 0) data.projects.push(project); else data.projects[editingIndex] = project;
    clearProjectForm(); renderProjectEditor(); renderFeaturedProjects(); setStatus('Project updated in the current draft. Save or export JSON.');
  } catch (error) { setStatus(error.message); }
});
$('save').addEventListener('click', () => {
  try {
    readProfileFields(); localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); updateHero();
    setStatus('Saved in this browser only. Download JSON and replace data.json on GitHub to publish.');
  } catch (error) { setStatus('Could not save browser draft. Try downloading JSON instead.'); }
});
function downloadFile(contents, filename, type = 'application/json;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contents], {type}));
  const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
$('export').addEventListener('click', () => {
  try { readProfileFields(); downloadFile(JSON.stringify(data, null, 2), 'data.json'); setStatus('JSON downloaded. Replace data.json in your GitHub repository and commit to publish.'); }
  catch (error) { setStatus(error.message); }
});
$('importButton').addEventListener('click', () => { try { requireEditor(); $('importFile').click(); } catch (error) { setStatus(error.message); } });
$('importFile').addEventListener('change', async event => {
  try {
    requireEditor(); const file = event.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) throw new Error('Maximum JSON size is 2 MB.');
    const imported = JSON.parse(await file.text()); if (!isValidPortfolio(imported)) throw new Error('Invalid portfolio JSON.');
    if (!confirm('Replace the current draft with this JSON?')) return;
    data = imported; PROFILE_FIELDS.forEach(key => { $(key).value = data[key]; });
    clearProjectForm(); renderProjectEditor(); updateHero(); setStatus('JSON imported into the current page. Save or export to publish.');
  } catch (error) { setStatus(error.message); }
  finally { event.target.value = ''; }
});
$('reset').addEventListener('click', () => {
  try {
    requireEditor();
    if (!confirm('Discard local changes and restore the published data loaded when this page opened?')) return;
    data = structuredClone(publishedData); try { localStorage.removeItem(STORAGE_KEY); } catch (error) {}
    PROFILE_FIELDS.forEach(key => { $(key).value = data[key]; });
    clearProjectForm(); renderProjectEditor(); updateHero(); setStatus('Published data restored in this page.');
  } catch (error) { setStatus(error.message); }
});

// Free browser SpeechSynthesis. Voice choice/quality depends on installed device voices.
const speechParts = [
  "Hi, my name is VK AI, and I'm here to introduce Vivek Singh.",
  "Vivek has more than thirteen years of experience in process automation, reporting, and business operations. He began in banking operations and grew into MIS, Excel automation, and VBA development. Today, he works with Power Automate, Power Apps, SharePoint, and Power BI, and is exploring AI agents.",
  "Explore the portfolio to see projects including the HRSS Command Center, onboarding automation, HR query tracking, and reporting tools. You can also download Vivek's résumé or use the contact links to get in touch."
];
let isSpeaking = false, speechIndex = 0;
function bestEnglishVoice() {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter(voice => /^en([-_]|$)/i.test(voice.lang));
  const score = voice => (/natural|neural|premium/i.test(voice.name) ? 4 : 0) +
    (/en-US|en-GB|en-AU/i.test(voice.lang) ? 2 : 0) + (/Google|Microsoft/i.test(voice.name) ? 1 : 0);
  return english.sort((a,b) => score(b) - score(a))[0] || voices[0] || null;
}
function setSpeakingAnimation(active) {
  $('character').classList.toggle('speaking', active);
}
function stopVoice() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  isSpeaking = false; speechIndex = 0; setSpeakingAnimation(false);
  if ($('voiceStatus')) $('voiceStatus').textContent = 'Voice stopped.';
  if ($('playVoice')) $('playVoice').setAttribute('aria-pressed','false');
}
function playIntroduction() {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    $('voiceStatus').textContent = 'Speech playback is not supported by this browser.'; return;
  }
  window.speechSynthesis.cancel(); isSpeaking = true; speechIndex = 0;
  $('playVoice').setAttribute('aria-pressed','true'); speakNextPart();
}
function speakNextPart() {
  if (!isSpeaking || speechIndex >= speechParts.length) {
    isSpeaking = false; setSpeakingAnimation(false);
    $('voiceStatus').textContent = 'Introduction finished. Tap Play / Replay to hear it again.';
    $('playVoice').setAttribute('aria-pressed','false'); return;
  }
  const line = speechParts[speechIndex++]; $('aiCaption').textContent = line;
  const utterance = new SpeechSynthesisUtterance(line);
  const voice = bestEnglishVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice ? voice.lang : 'en-US'; utterance.rate = 0.92; utterance.pitch = 1;
  utterance.onstart = () => {
    if (!isSpeaking) return;
    setSpeakingAnimation(true);
    $('voiceStatus').textContent = voice ? 'Speaking with ' + voice.name + '.' : 'Speaking with your browser default voice.';
  };
  utterance.onend = () => {
    setSpeakingAnimation(false);
    if (isSpeaking) speakNextPart();
  };
  utterance.onerror = () => {
    setSpeakingAnimation(false); isSpeaking = false;
    $('voiceStatus').textContent = 'Could not play speech. Check browser voice settings and try again.';
    $('playVoice').setAttribute('aria-pressed','false');
  };
  window.speechSynthesis.speak(utterance);
}
$('playVoice').addEventListener('click', playIntroduction);
$('stopVoice').addEventListener('click', stopVoice);
if ('speechSynthesis' in window) window.speechSynthesis.addEventListener?.('voiceschanged', () => {});

(async function initialise() {
  try {
    const response = await fetch('data.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Could not load data.json.');
    publishedData = await response.json();
    if (!isValidPortfolio(publishedData)) throw new Error('data.json has an unexpected format.');
    data = structuredClone(publishedData);
    try {
      const localDraft = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (isValidPortfolio(localDraft)) data = localDraft;
    } catch (error) {}
    updateHero(); showScreen('entry');
  } catch (error) {
    setStatus(error.message + ' Please open this site through GitHub Pages or a local web server, not by double-clicking index.html.');
    $('userEntry').disabled = true; $('adminEntry').disabled = true; $('playVoice').disabled = true;
  }
})();
