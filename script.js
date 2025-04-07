// ===== משתנים גלובליים =====
let totalParticipants = 0;
let currentStep = 1;
let userDetails = {};
let sessionId = generateUniqueId();
let syncVersion = 0;
let deviceType = detectDeviceType();
let isOnline = navigator.onLine;

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBXH7JgXlWLYsRcoPMPgTYd8mKqTFNaKfg",
  authDomain: "group-purchase-demo.firebaseapp.com",
  databaseURL: "https://group-purchase-demo-default-rtdb.firebaseio.com",
  projectId: "group-purchase-demo",
  storageBucket: "group-purchase-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1234567890abcdef123456"
};

// ===== אתחול Firebase =====
document.addEventListener('DOMContentLoaded', function() {
  // אתחול Firebase
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    showNotification('סנכרון', 'מתחבר למסד הנתונים...', 'sync');
    initializeFirebaseListeners();
  } else {
    console.warn('Firebase לא נטען. הסנכרון לא יעבוד.');
    updateSyncStatus('not-synced');
  }

  // אתחול IndexedDB
  initializeIndexedDB();
  
  // אתחול Broadcast Channel
  initializeBroadcastChannel();
  
  // אתחול מאזיני אירועים
  initializeEventListeners();
  
  // אתחול נתונים
  initializeData();
  
  // אתחול מיוחד למובייל
  initializeMobileView();
});

// ===== פונקציות אתחול =====
function initializeMobileView() {
  // בדיקה אם המכשיר הוא מובייל
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    console.log('זוהה מכשיר נייד, מבצע התאמות');
    
    // וידוא שהשלבים מוצגים כראוי
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
      if (!step.classList.contains('active')) {
        step.style.display = 'none';
      } else {
        step.style.display = 'block';
      }
    });
    
    // הוספת מאזינים לחיצה על כפתורי ניווט
    const navButtons = document.querySelectorAll('.progress-step');
    navButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
        showStep(index + 1);
      });
    });
    
    // הוספת מאזין לשינוי גודל המסך
    window.addEventListener('resize', function() {
      // וידוא שהשלב הנוכחי מוצג כראוי
      const currentStepElement = document.getElementById(`step${currentStep}`);
      if (currentStepElement) {
        currentStepElement.style.display = 'block';
      }
    });
    
    // הוספת מחלקות מיוחדות למובייל
    document.body.classList.add('mobile-device');
    
    // וידוא שהתוכן מוצג כראוי
    setTimeout(function() {
      // וידוא שוב לאחר טעינת הדף
      const currentStepElement = document.getElementById(`step${currentStep}`);
      if (currentStepElement) {
        currentStepElement.style.display = 'block';
      }
    }, 500);
  }
}

function initializeEventListeners() {
  // מאזין למצב חיבור לאינטרנט
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
  
  // מאזיני טופס
  const userDetailsForm = document.getElementById('user-details-form');
  if (userDetailsForm) {
    userDetailsForm.addEventListener('submit', function(event) {
      event.preventDefault();
      submitUserDetails();
    });
  }
  
  // מאזיני שיטת משלוח
  const deliveryRadios = document.querySelectorAll('input[name="delivery-method"]');
  deliveryRadios.forEach(radio => {
    radio.addEventListener('change', updateDeliveryPrice);
  });
}

function initializeData() {
  // אתחול טיימר
  initializeCountdown();
  
  // אתחול מספר משתתפים
  updateTotalParticipants();
  
  // עדכון סרגל מחיר
  updatePriceBar();
  
  // עדכון מחירים
  updatePrices();
  
  // יצירת מספר הזמנה
  generateOrderNumber();
  
  // טעינת פרטי משתמש מקומיים
  loadUserDetailsFromStorage();
}

function initializeFirebaseListeners() {
  const db = firebase.database();
  
  // האזנה לשינויים במספר המשתתפים
  db.ref('totalParticipants').on('value', (snapshot) => {
    const firebaseParticipants = snapshot.val();
    if (firebaseParticipants && firebaseParticipants > totalParticipants) {
      totalParticipants = firebaseParticipants;
      localStorage.setItem('totalParticipants', totalParticipants.toString());
      updateParticipantsDisplay();
      updatePriceBar();
      updatePrices();
      showNotification('עדכון', 'מספר המשתתפים עודכן!', 'success');
    }
  });
  
  // האזנה לשינויים בפרטי המשתמש
  db.ref(`userDetails/${sessionId}`).on('value', (snapshot) => {
    const firebaseUserDetails = snapshot.val();
    if (firebaseUserDetails && firebaseUserDetails.syncVersion > syncVersion) {
      userDetails = firebaseUserDetails;
      syncVersion = firebaseUserDetails.syncVersion;
      localStorage.setItem('userDetails', JSON.stringify(userDetails));
      fillUserDetailsForm(userDetails);
      showNotification('סנכרון', 'פרטי המשתמש עודכנו!', 'sync');
    }
  });
  
  updateSyncStatus('synced');
}

function initializeIndexedDB() {
  const request = indexedDB.open('groupPurchaseDB', 1);
  
  request.onupgradeneeded = function(event) {
    const db = event.target.result;
    
    // מאגר נתונים למשתתפים
    if (!db.objectStoreNames.contains('participants')) {
      db.createObjectStore('participants', { keyPath: 'id' });
    }
    
    // מאגר נתונים לפרטי משתמש
    if (!db.objectStoreNames.contains('userDetails')) {
      db.createObjectStore('userDetails', { keyPath: 'sessionId' });
    }
  };
  
  request.onsuccess = function() {
    console.log('IndexedDB נטען בהצלחה');
  };
  
  request.onerror = function(event) {
    console.error('שגיאה בטעינת IndexedDB:', event.target.error);
  };
}

function initializeBroadcastChannel() {
  const channel = new BroadcastChannel('group_purchase_sync');
  
  channel.onmessage = function(event) {
    const data = event.data;
    
    if (data.type === 'participants_update') {
      if (data.totalParticipants > totalParticipants) {
        totalParticipants = data.totalParticipants;
        localStorage.setItem('totalParticipants', totalParticipants.toString());
        updateParticipantsDisplay();
        updatePriceBar();
        updatePrices();
      }
    } else if (data.type === 'user_details_update') {
      if (data.userDetails && data.userDetails.syncVersion > syncVersion) {
        userDetails = data.userDetails;
        syncVersion = data.userDetails.syncVersion;
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
        fillUserDetailsForm(userDetails);
      }
    }
  };
}

// ===== פונקציות סנכרון =====
function handleOnlineStatus() {
  isOnline = navigator.onLine;
  
  if (isOnline) {
    updateSyncStatus('synced');
    syncDataToFirebase();
  } else {
    updateSyncStatus('not-synced');
    showMessage('אין חיבור לאינטרנט. הנתונים ישמרו מקומית.', 'error');
  }
}

function updateSyncStatus(status) {
  const syncIndicator = document.getElementById('sync-indicator');
  
  if (syncIndicator) {
    syncIndicator.className = 'sync-status ' + status;
    
    if (status === 'synced') {
      syncIndicator.innerHTML = '<i class="fas fa-check"></i> מסונכרן';
    } else if (status === 'syncing') {
      syncIndicator.innerHTML = '<i class="fas fa-sync syncing-indicator"></i> מסנכרן...';
    } else {
      syncIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> לא מסונכרן';
    }
  }
}

function syncDataToFirebase() {
  if (!isOnline || typeof firebase === 'undefined') return;
  
  updateSyncStatus('syncing');
  
  const db = firebase.database();
  
  // סנכרון מספר משתתפים
  db.ref('totalParticipants').set(totalParticipants)
    .then(() => {
      console.log('מספר המשתתפים סונכרן בהצלחה');
    })
    .catch(error => {
      console.error('שגיאה בסנכרון מספר המשתתפים:', error);
    });
  
  // סנכרון פרטי משתמש
  if (Object.keys(userDetails).length > 0) {
    db.ref(`userDetails/${sessionId}`).set(userDetails)
      .then(() => {
        console.log('פרטי המשתמש סונכרנו בהצלחה');
        updateSyncStatus('synced');
      })
      .catch(error => {
        console.error('שגיאה בסנכרון פרטי המשתמש:', error);
        updateSyncStatus('not-synced');
      });
  } else {
    updateSyncStatus('synced');
  }
}

function broadcastUpdate(type, data) {
  const channel = new BroadcastChannel('group_purchase_sync');
  channel.postMessage({ type, ...data });
}

// ===== פונקציות ניהול משתתפים =====
function updateTotalParticipants() {
  const savedParticipants = localStorage.getItem('totalParticipants');
  
  if (savedParticipants) {
    totalParticipants = parseInt(savedParticipants);
  } else {
    // מתחילים מ-0 משתתפים
    totalParticipants = 0;
    localStorage.setItem('totalParticipants', totalParticipants.toString());
  }
  
  // הגבלה למקסימום 500 משתתפים
  totalParticipants = Math.min(totalParticipants, 500);
  
  // עדכון תצוגה
  updateParticipantsDisplay();
  
  // סנכרון לשרת
  if (isOnline && typeof firebase !== 'undefined') {
    firebase.database().ref('totalParticipants').set(totalParticipants);
  }
}

function updateParticipantsDisplay() {
  const participantsCount = document.getElementById('participants-count');
  
  if (participantsCount) {
    // אנימציה לשינוי מספר המשתתפים
    participantsCount.classList.add('participants-change');
    participantsCount.textContent = totalParticipants;
    
    setTimeout(() => {
      participantsCount.classList.remove('participants-change');
    }, 1000);
  }
}

function addNewParticipant() {
  // הוספת משתתף חדש
  totalParticipants++;
  totalParticipants = Math.min(totalParticipants, 500);
  
  // שמירה מקומית
  localStorage.setItem('totalParticipants', totalParticipants.toString());
  
  // עדכון תצוגה
  updateParticipantsDisplay();
  updatePriceBar();
  updatePrices();
  
  // הצגת הודעה
  showMessage('משתתף חדש הצטרף לקמפיין!', 'success');
  
  // סנכרון
  syncDataToFirebase();
  broadcastUpdate('participants_update', { totalParticipants });
  
  // אנימציה לסרגל המחיר
  animatePriceBar();
}

// ===== פונקציות ניהול מחירים =====
function calculatePrice() {
  // חישוב אחוז ההנחה בהתאם למספר המשתתפים
  let discountPercent = 0;
  
  if (totalParticipants < 50) {
    discountPercent = 5; // 5% הנחה עד 50 משתתפים
  } else if (totalParticipants < 100) {
    discountPercent = 10; // 10% הנחה עד 100 משתתפים
  } else if (totalParticipants < 200) {
    discountPercent = 15; // 15% הנחה עד 200 משתתפים
  } else if (totalParticipants < 300) {
    discountPercent = 20; // 20% הנחה עד 300 משתתפים
  } else {
    discountPercent = 25; // 25% הנחה מעל 300 משתתפים
  }
  
  // מחיר מקורי: 5000 ש"ח
  const originalPrice = 5000;
  const discountAmount = originalPrice * (discountPercent / 100);
  const finalPrice = originalPrice - discountAmount;
  
  return {
    originalPrice,
    discountPercent,
    discountAmount,
    finalPrice
  };
}

function updatePrices() {
  const priceInfo = calculatePrice();
  
  // עדכון מחיר נוכחי
  const currentPriceElement = document.getElementById('current-price');
  if (currentPriceElement) {
    currentPriceElement.classList.add('price-change');
    currentPriceElement.textContent = formatPrice(priceInfo.finalPrice);
    
    setTimeout(() => {
      currentPriceElement.classList.remove('price-change');
    }, 1000);
  }
  
  // עדכון מחיר בסיכום
  const summaryPriceElement = document.getElementById('summary-price');
  if (summaryPriceElement) {
    summaryPriceElement.textContent = formatPrice(priceInfo.finalPrice);
  }
  
  // עדכון מחיר מוצר בפירוט תשלום
  const productPriceElement = document.getElementById('product-price');
  if (productPriceElement) {
    productPriceElement.textContent = formatPrice(priceInfo.finalPrice);
  }
  
  // עדכון סה"כ לתשלום
  updateTotalPrice();
}

function updatePriceBar() {
  const priceInfo = calculatePrice();
  const progressElement = document.querySelector('.price-progress');
  
  if (progressElement) {
    // עדכון רוחב סרגל המחיר לפי אחוז ההנחה
    const progressWidth = (priceInfo.discountPercent / 25) * 100; // 25% זה המקסימום
    progressElement.style.width = `${progressWidth}%`;
    
    // עדכון אבני דרך פעילות
    const milestones = document.querySelectorAll('.milestone');
    milestones.forEach((milestone, index) => {
      const milestonePercent = index * 25; // 0%, 25%, 50%, 75%, 100%
      if (progressWidth >= milestonePercent) {
        milestone.classList.add('active');
      } else {
        milestone.classList.remove('active');
      }
    });
  }
}

function animatePriceBar() {
  const progressElement = document.querySelector('.price-progress');
  
  if (progressElement) {
    progressElement.classList.add('pulse');
    
    setTimeout(() => {
      progressElement.classList.remove('pulse');
    }, 1000);
  }
}

function updateDeliveryPrice() {
  const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked');
  const deliveryPriceRow = document.getElementById('delivery-price-row');
  const deliveryPriceElement = document.getElementById('delivery-price');
  
  if (deliveryMethod && deliveryPriceElement) {
    if (deliveryMethod.value === 'delivery') {
      deliveryPriceRow.style.display = 'flex';
      deliveryPriceElement.textContent = '150 ₪';
    } else {
      deliveryPriceRow.style.display = 'none';
      deliveryPriceElement.textContent = '0 ₪';
    }
    
    // עדכון סה"כ לתשלום
    updateTotalPrice();
  }
}

function updateTotalPrice() {
  const priceInfo = calculatePrice();
  const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked');
  const totalPriceElement = document.getElementById('total-price');
  const paymentPriceElement = document.getElementById('payment-price');
  const remainingAmountElement = document.getElementById('remaining-amount');
  
  if (totalPriceElement) {
    let totalPrice = priceInfo.finalPrice;
    
    // הוספת עלות משלוח אם נבחר משלוח
    if (deliveryMethod && deliveryMethod.value === 'delivery') {
      totalPrice += 150;
    }
    
    // עדכון סה"כ לתשלום
    totalPriceElement.textContent = formatPrice(totalPrice);
    
    // עדכון סכום לתשלום בדף התשלום
    if (paymentPriceElement) {
      paymentPriceElement.textContent = formatPrice(totalPrice);
    }
    
    // עדכון יתרה לתשלום באישור
    if (remainingAmountElement) {
      remainingAmountElement.textContent = formatPrice(totalPrice - 100);
    }
  }
}

// ===== פונקציות ניהול טפסים =====
function submitUserDetails() {
  // איסוף נתונים מהטופס
  const firstName = document.getElementById('first-name').value;
  const lastName = document.getElementById('last-name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const city = document.getElementById('city').value;
  const street = document.getElementById('street').value;
  const houseNumber = document.getElementById('house-number').value;
  const notes = document.getElementById('notes').value;
  const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked').value;
  
  // וידוא שכל השדות החובה מלאים
  if (!firstName || !lastName || !phone || !email || !city || !street || !houseNumber) {
    showMessage('אנא מלא את כל שדות החובה', 'error');
    return;
  }
  
  // שמירת פרטי המשתמש
  userDetails = {
    firstName,
    lastName,
    phone,
    email,
    city,
    street,
    houseNumber,
    notes,
    deliveryMethod,
    sessionId,
    syncVersion: syncVersion + 1,
    deviceType,
    timestamp: new Date().toISOString()
  };
  
  // עדכון גרסת הסנכרון
  syncVersion = userDetails.syncVersion;
  
  // שמירה מקומית
  localStorage.setItem('userDetails', JSON.stringify(userDetails));
  
  // עדכון סיכום
  updateSummary();
  
  // סנכרון
  syncDataToFirebase();
  broadcastUpdate('user_details_update', { userDetails });
  
  // מעבר לשלב הבא
  showStep(3);
  
  // הצגת הודעה
  showMessage('הפרטים נשמרו בהצלחה', 'success');
}

function fillUserDetailsForm(details) {
  // מילוי הטופס בפרטים שהתקבלו
  if (details.firstName) document.getElementById('first-name').value = details.firstName;
  if (details.lastName) document.getElementById('last-name').value = details.lastName;
  if (details.phone) document.getElementById('phone').value = details.phone;
  if (details.email) document.getElementById('email').value = details.email;
  if (details.city) document.getElementById('city').value = details.city;
  if (details.street) document.getElementById('street').value = details.street;
  if (details.houseNumber) document.getElementById('house-number').value = details.houseNumber;
  if (details.notes) document.getElementById('notes').value = details.notes;
  
  // עדכון שיטת משלוח
  if (details.deliveryMethod) {
    const deliveryRadio = document.querySelector(`input[name="delivery-method"][value="${details.deliveryMethod}"]`);
    if (deliveryRadio) {
      deliveryRadio.checked = true;
      updateDeliveryPrice();
    }
  }
  
  // הצגת הודעה
  showNotification('סנכרון', 'הטופס עודכן עם הפרטים האחרונים', 'sync');
}

function loadUserDetailsFromStorage() {
  const savedDetails = localStorage.getItem('userDetails');
  
  if (savedDetails) {
    try {
      userDetails = JSON.parse(savedDetails);
      syncVersion = userDetails.syncVersion || 0;
      fillUserDetailsForm(userDetails);
      updateSummary();
    } catch (error) {
      console.error('שגיאה בטעינת פרטי משתמש מהאחסון המקומי:', error);
    }
  }
}

function updateSummary() {
  // עדכון פרטי המשתמש בדף הסיכום
  if (Object.keys(userDetails).length > 0) {
    document.getElementById('summary-name').textContent = `${userDetails.firstName} ${userDetails.lastName}`;
    document.getElementById('summary-phone').textContent = userDetails.phone;
    document.getElementById('summary-email').textContent = userDetails.email;
    document.getElementById('summary-address').textContent = `${userDetails.street} ${userDetails.houseNumber}, ${userDetails.city}`;
    document.getElementById('summary-delivery').textContent = userDetails.deliveryMethod === 'delivery' ? 'משלוח עד הבית' : 'איסוף עצמי';
  }
}

function simulatePayment() {
  // בדיקת שדות תשלום
  const cardNumber = document.getElementById('card-number').value;
  const expiryDate = document.getElementById('expiry-date').value;
  const cvv = document.getElementById('cvv').value;
  const cardHolder = document.getElementById('card-holder').value;
  const idNumber = document.getElementById('id-number').value;
  
  if (!cardNumber || !expiryDate || !cvv || !cardHolder || !idNumber) {
    showMessage('אנא מלא את כל פרטי התשלום', 'error');
    return;
  }
  
  // סימולציה של תהליך תשלום
  showMessage('מעבד תשלום...', 'info');
  
  // הוספת אנימציית טעינה
  const paymentContainer = document.querySelector('.payment-container');
  paymentContainer.classList.add('loading');
  
  // סימולציה של זמן עיבוד
  setTimeout(() => {
    // הסרת אנימציית טעינה
    paymentContainer.classList.remove('loading');
    
    // עדכון תאריך ההזמנה
    document.getElementById('order-date').textContent = new Date().toLocaleDateString('he-IL');
    
    // מעבר לשלב האישור
    showStep(5);
    
    // הצגת הודעה
    showMessage('התשלום בוצע בהצלחה!', 'success');
    
    // הוספת משתתף חדש
    addNewParticipant();
  }, 2000);
}

// ===== פונקציות ניווט =====
function showStep(step) {
  // הסתרת כל השלבים
  const steps = document.querySelectorAll('.step');
  steps.forEach(stepElement => {
    stepElement.classList.remove('active');
    // וידוא שהשלב לא מוסתר עם display: none במקום עם המחלקה
    stepElement.style.display = 'none';
  });
  
  // הצגת השלב הנבחר
  const currentStepElement = document.getElementById(`step${step}`);
  if (currentStepElement) {
    currentStepElement.classList.add('active');
    currentStepElement.style.display = 'block';
    currentStep = step;
    
    // עדכון סרגל התקדמות
    updateProgressBar();
    
    // גלילה לראש העמוד
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // הוספת הדפסה לבדיקה
    console.log(`מציג שלב ${step}`);
  }
}

function updateProgressBar() {
  // עדכון מילוי סרגל ההתקדמות
  const progressFill = document.querySelector('.progress-fill');
  if (progressFill) {
    progressFill.style.width = `${(currentStep / 5) * 100}%`;
  }
  
  // עדכון שלבים פעילים
  const progressSteps = document.querySelectorAll('.progress-step');
  progressSteps.forEach((step, index) => {
    const stepNumber = index + 1;
    
    if (stepNumber < currentStep) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepNumber === currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
}

// ===== פונקציות טיימר =====
function initializeCountdown() {
  // יצירת תאריך סיום הקמפיין - 7 ימים מהיום
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);
  endDate.setHours(23, 59, 59, 0);
  
  // שמירת תאריך הסיום באחסון מקומי
  const savedEndDate = localStorage.getItem('campaignEndDate');
  if (!savedEndDate) {
    localStorage.setItem('campaignEndDate', endDate.toISOString());
  } else {
    endDate.setTime(new Date(savedEndDate).getTime());
  }
  
  // התחלת הטיימר
  updateCountdown(endDate);
  setInterval(() => updateCountdown(endDate), 1000);
}

function updateCountdown(endDate) {
  const now = new Date();
  const distance = endDate.getTime() - now.getTime();
  
  // חישוב זמן שנותר
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  // עדכון התצוגה
  document.getElementById('days').textContent = days.toString().padStart(2, '0');
  document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
  document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
  document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
  
  // אם הזמן נגמר
  if (distance < 0) {
    document.getElementById('days').textContent = '00';
    document.getElementById('hours').textContent = '00';
    document.getElementById('minutes').textContent = '00';
    document.getElementById('seconds').textContent = '00';
    
    // הצגת הודעה שהקמפיין הסתיים
    showNotification('סיום קמפיין', 'הקמפיין הסתיים! המחיר הסופי נקבע.', 'success');
  }
}

// ===== פונקציות עזר =====
function generateUniqueId() {
  // יצירת מזהה ייחודי למשתמש/מכשיר
  const savedSessionId = localStorage.getItem('sessionId');
  if (savedSessionId) {
    return savedSessionId;
  }
  
  const timestamp = new Date().getTime();
  const randomPart = Math.floor(Math.random() * 1000000);
  const newSessionId = `${timestamp}-${randomPart}`;
  
  localStorage.setItem('sessionId', newSessionId);
  return newSessionId;
}

function detectDeviceType() {
  // זיהוי סוג המכשיר
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
  const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

function formatPrice(price) {
  // עיצוב מחירים בפורמט שקל
  return price.toLocaleString('he-IL') + ' ₪';
}

function generateOrderNumber() {
  // יצירת מספר הזמנה אקראי
  const orderNumberElement = document.getElementById('order-number');
  
  if (orderNumberElement) {
    const prefix = 'GP';
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `${prefix}-${timestamp}-${random}`;
    
    orderNumberElement.textContent = orderNumber;
  }
}

function changeMainImage(src) {
  // החלפת התמונה הראשית בגלריה
  const mainImage = document.getElementById('main-product-image');
  const thumbnails = document.querySelectorAll('.thumbnail-images img');
  
  if (mainImage) {
    // הוספת אנימציה להחלפת תמונה
    mainImage.style.opacity = '0';
    
    setTimeout(() => {
      mainImage.src = src;
      mainImage.style.opacity = '1';
    }, 300);
    
    // עדכון התמונה המודגשת
    thumbnails.forEach(thumbnail => {
      if (thumbnail.src === src) {
        thumbnail.classList.add('active-thumbnail');
      } else {
        thumbnail.classList.remove('active-thumbnail');
      }
    });
  }
}

// ===== פונקציות הודעות =====
function showMessage(text, type = 'info') {
  // הצגת הודעה קצרה בתחתית המסך
  const messageElement = document.getElementById('message');
  
  if (messageElement) {
    // הסרת הודעה קודמת
    messageElement.classList.remove('show', 'success', 'error', 'info');
    
    // הגדרת ההודעה החדשה
    messageElement.textContent = text;
    messageElement.classList.add('show', type);
    
    // הסתרת ההודעה לאחר 3 שניות
    setTimeout(() => {
      messageElement.classList.remove('show');
    }, 3000);
  }
}

function showNotification(title, message, type = 'info') {
  // הצגת התראה בפינה העליונה
  const container = document.getElementById('notification-container');
  
  if (container) {
    // יצירת אלמנט ההתראה
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // יצירת תוכן ההתראה
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'sync') icon = 'fa-sync';
    
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas ${icon}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
    `;
    
    // הוספת ההתראה למיכל
    container.appendChild(notification);
    
    // הסרת ההתראה לאחר 5 שניות
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        container.removeChild(notification);
      }, 300);
    }, 5000);
  }
}

// הוספת סקריפט Firebase באופן דינמי
(function loadFirebase() {
  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js';
  script.onload = function() {
    // טעינת מודול בסיס הנתונים
    const dbScript = document.createElement('script');
    dbScript.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js';
    document.head.appendChild(dbScript);
  };
  document.head.appendChild(script);
})();
