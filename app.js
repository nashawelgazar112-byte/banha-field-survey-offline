
const DB_NAME = 'BanhaFieldSurvey';
const STORE_NAME = 'pendingRecords';

const $ = id => document.getElementById(id);

let db;

  options.forEach(option => {
    if (option.value) {
      unitSelect.add(new Option(option.textContent, option.value));
    }
  });

  if (!options.length) {
    throw new Error('لم يتم العثور على قائمة الوحدات');
  }
}
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = event => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

function saveLocally(record) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const request = transaction.objectStore(STORE_NAME).add(record);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getPendingRecords() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function updateConnection() {
  $('connection').textContent = navigator.onLine
    ? 'متصل بالإنترنت'
    : 'غير متصل — التسجيلات ستحفظ على الجهاز';

  $('connection').style.color = navigator.onLine
    ? '#16834a'
    : '#b36b00';
}

function toggleReason() {
  const show = $('status').value === 'غير مطعّم';

  $('reasonBox').classList.toggle('hidden', !show);
  $('reason').required = show;

  if (!show) $('reason').value = '';
}

async function showPendingCount() {
  const records = await getPendingRecords();

  $('message').textContent =
    records.length
      ? `تم حفظ التسجيل على الجهاز. تسجيلات تنتظر المزامنة: ${records.length}`
      : 'تم حفظ التسجيل على الجهاز بنجاح';

  $('message').style.color = '#16834a';
}

$('status').addEventListener('change', toggleReason);

$('recordForm').addEventListener('submit', async event => {
  event.preventDefault();

  const button = $('saveButton');
  button.disabled = true;
  button.textContent = 'جاري الحفظ على الجهاز...';

  const record = {
    createdAt: new Date().toISOString(),
    unit: $('unit').value,
    address: $('address').value.trim(),
    phone: $('phone').value.trim(),
    childName: $('childName').value.trim(),
    ageGroup: $('ageGroup').value,
    status: $('status').value,
    reason: $('reason').value,
    awareness: $('awareness').value.trim(),
    researcher: $('researcher').value.trim()
  };

  try {
    await saveLocally(record);

    const researcher = record.researcher;
    const unit = record.unit;

    $('recordForm').reset();
    $('researcher').value = researcher;
    $('unit').value = unit;

    toggleReason();
    await showPendingCount();

  } catch (error) {
    $('message').textContent = 'تعذر حفظ البيانات على الجهاز. لا تغلقي الصفحة.';
    $('message').style.color = '#c62828';

  } finally {
    button.disabled = false;
    button.textContent = 'حفظ وإضافة طفل آخر';
  }
});

window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);

(async function startApp() {
  try {
    await openDatabase();
    updateConnection();
  } catch (error) {
    $('connection').textContent = 'تعذر تشغيل التخزين المحلي على هذا الجهاز';
    $('connection').style.color = '#c62828';
    $('saveButton').disabled = true;
  }
})();
