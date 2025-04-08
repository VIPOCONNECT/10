// ===== משתנים גלובליים =====
let currentStep = 1;
let participants = []; // מערך לשמירת המשתתפים הנוספים
let userData = {}; // אובייקט לשמירת פרטי המשתמש הראשי

// מחירים
const prices = {
    regular: 6999,
    medium: 5999, // 5-9 משתתפים
    large: 4999   // 10+ משתתפים
};

// ===== אתחול האפליקציה =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('האפליקציה נטענה');
    
    // טעינת נתונים מ-localStorage אם קיימים
    loadSavedData();
    
    // אתחול סרגל ההתקדמות
    updateProgressBar(currentStep);
    
    // הוספת מאזינים לאירועים
    setupEventListeners();
    
    // הצגת השלב הנוכחי
    showStep(currentStep);
    
    // הוספת מחלקת CSS לזיהוי מכשירים ניידים
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        document.body.classList.add('mobile-device');
    } else {
        document.body.classList.add('desktop-device');
    }
});

// ===== פונקציות ניהול שלבים =====



/**
 * טעינת נתונים שמורים מ-localStorage
 */
function loadSavedData() {
    // טעינת השלב הנוכחי
    const savedStep = localStorage.getItem('currentStep');
    if (savedStep) {
        currentStep = parseInt(savedStep);
    }
    
    // טעינת פרטי המשתמש
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        userData = JSON.parse(savedUserData);
    }
    
    // טעינת משתתפים נוספים
    const savedParticipants = localStorage.getItem('participants');
    if (savedParticipants) {
        participants = JSON.parse(savedParticipants);
    }
    
    console.log('נטענו נתונים מ-localStorage:', { currentStep, participants: participants.length });
}

/**
 * הוספת מאזינים לאירועים
 */
function setupEventListeners() {
    // מאזינים לצעדים בסרגל ההתקדמות
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(step => {
        const stepNumber = parseInt(step.getAttribute('data-step'));
        
        // מאזין לחיצה רגיל
        step.addEventListener('click', function(e) {
            e.preventDefault(); // מניעת התנהגות ברירת מחדל
            // אפשר לחזור לשלבים קודמים, אבל לא לקפוץ קדימה
            if (stepNumber < currentStep) {
                showStep(stepNumber);
            }
        });
        
        // מאזין מגע למכשירים ניידים
        step.addEventListener('touchend', function(e) {
            e.preventDefault(); // מניעת התנהגות ברירת מחדל
            // אפשר לחזור לשלבים קודמים, אבל לא לקפוץ קדימה
            if (stepNumber < currentStep) {
                showStep(stepNumber);
            }
        });
        
        // הוספת אפקט hover
        step.addEventListener('mouseenter', function() {
            if (stepNumber <= currentStep) {
                this.style.transform = 'translateY(-3px)';
            }
        });
        
        step.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // מאזינים לשדות טופס
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        // הוספת אפקט focus
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            // בדיקת תקינות בעת יציאה מהשדה
            validateField(this);
        });
    });
    
    // מאזין לכפתור הוספת משתתף
    const addParticipantBtn = document.getElementById('add-participant');
    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', addNewParticipant);
    }
    
    // מאזינים לכפתורי פעולה בכל השלבים
    setupActionButtonListeners();
}

/**
 * הוספת מאזינים לכפתורי פעולה בכל השלבים
 */
function setupActionButtonListeners() {
    // כפתור להצטרפות לרכישה הקבוצתית בשלב 1 - שימוש במזהה החדש
    const joinGroupBtn = document.getElementById('join-group-btn');
    if (joinGroupBtn) {
        console.log('נמצא כפתור הצטרפות חדש');
        
        // הסרת כל המאזינים הקיימים למניעת כפילויות
        const oldClickListener = function() { showStep(2); };
        const oldTouchListener = function() { showStep(2); };
        joinGroupBtn.removeEventListener('click', oldClickListener);
        joinGroupBtn.removeEventListener('touchend', oldTouchListener);
        
        // הוספת מאזין לחיצה חדש
        joinGroupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('לחיצה על כפתור הצטרפות');
            setTimeout(function() {
                showStep(2);
            }, 10); // הוספת השהיה קטנה לשיפור התגובה במובייל
        });
        
        // מאזין מגע משופר למובייל
        joinGroupBtn.addEventListener('touchstart', function(e) {
            // הוספת מחלקת CSS למצב לחיצה
            this.classList.add('btn-active');
        }, { passive: true });
        
        joinGroupBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('מגע על כפתור הצטרפות');
            
            // הסרת מחלקת CSS למצב לחיצה
            this.classList.remove('btn-active');
            
            // השהיה קטנה לשיפור התגובה במובייל
            setTimeout(function() {
                showStep(2);
            }, 10);
        }, { passive: false });
    } else {
        console.warn('לא נמצא כפתור הצטרפות עם מזהה join-group-btn');
        
        // ניסיון למצוא את הכפתור בדרך אחרת
        const fallbackBtn = document.querySelector('#step1 .btn-primary');
        if (fallbackBtn) {
            console.log('נמצא כפתור הצטרפות בדרך חלופית');
            
            fallbackBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showStep(2);
            });
            
            fallbackBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showStep(2);
            }, { passive: false });
        }
    }
    
    // כפתורי פעולה נוספים בשלבים אחרים
    document.querySelectorAll('.action-buttons .btn').forEach(btn => {
        // הוספת מאזין מגע לכל הכפתורים
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // הפונקציה המקורית תופעל דרך מאזין ה-click
        }, { passive: false });
    });
}

/**
 * עדכון סרגל ההתקדמות
 * @param {number} stepNumber - מספר השלב הנוכחי
 */
function updateProgressBar(stepNumber) {
    // עדכון מילוי הסרגל
    const progressFill = document.getElementById('progress-fill');
    const percentage = ((stepNumber - 1) / 3) * 100;
    progressFill.style.width = `${percentage}%`;
    
    // עדכון סטטוס הצעדים
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        step.classList.remove('active', 'completed');
        
        if (stepNum === stepNumber) {
            step.classList.add('active');
        } else if (stepNum < stepNumber) {
            step.classList.add('completed');
        }
    });
}

/**
 * הצגת שלב מסוים
 * @param {number} stepNumber - מספר השלב להצגה
 */
function showStep(stepNumber) {
    console.log('מעבר לשלב:', stepNumber);
    
    // וידוא שהפרמטר הוא מספר תקין
    stepNumber = parseInt(stepNumber);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 5) {
        console.error('מספר שלב לא תקין:', stepNumber);
        return;
    }
    
    // עדכון מספר המשתתפים והמחירים לפני מעבר בין שלבים
    updateTotalParticipants();
    
    // הסתרת כל השלבים - שימוש ב-CSS ולא בשינוי סגנון ישיר
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        step.classList.remove('active');
        // הסרת סגנון display ישיר ושימוש במחלקות CSS
        step.removeAttribute('style');
        step.classList.add('step-hidden');
    });
    
    // הצגת השלב הנבחר
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    if (currentStepElement) {
        // שמירת השלב הנוכחי במשתנה גלובלי
        currentStep = stepNumber;
        
        // שמירת השלב הנוכחי ב-localStorage
        try {
            localStorage.setItem('currentStep', stepNumber.toString());
        } catch (e) {
            console.warn('לא ניתן לשמור ב-localStorage:', e);
        }
        
        // עדכון סרגל ההתקדמות
        updateProgressBar(stepNumber);
        
        // הצגת השלב הנוכחי - שימוש במחלקות CSS
        currentStepElement.classList.add('active');
        currentStepElement.classList.remove('step-hidden');
        
        // אם זה שלב 2, אתחל את טופס מילוי הפרטים ועדכן את האזור האישי
        if (stepNumber === 2) {
            setTimeout(() => updateUserArea(), 50); // הוספת השהיה קטנה לטיפול בבעיות תזמון
        }
        
        // אם זה שלב 3, עדכן את הסיכום
        if (stepNumber === 3) {
            setTimeout(() => updateSummary(), 50);
        }
        
        // אם זה שלב 4, עדכן את התשלום
        if (stepNumber === 4) {
            setTimeout(() => updatePayment(), 50);
        }
    } else {
        console.error(`לא נמצא אלמנט עם ID: step${stepNumber}`);
        return;
    }
    
    // גלילה לראש העמוד - עם תמיכה בדפדפנים ישנים
    try {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } catch (e) {
        // פתרון חלופי לדפדפנים ישנים
        window.scrollTo(0, 0);
    }
    
    // הוספת לוג לאישור המעבר
    console.log('הוצג בהצלחה שלב:', stepNumber);
}

// ===== פונקציות לשלב 2: פרטים אישיים =====

/**
 * עדכון אזור הפרטים האישיים
 */
function updateUserArea() {
    // מילוי שדות הטופס עם נתונים שמורים אם קיימים
    if (userData.fullName) {
        document.getElementById('fullName').value = userData.fullName;
    }
    if (userData.email) {
        document.getElementById('email').value = userData.email;
    }
    if (userData.phone) {
        document.getElementById('phone').value = userData.phone;
    }
    if (userData.address) {
        document.getElementById('address').value = userData.address;
    }
    
    // עדכון תצוגת המשתתפים
    updateParticipantsDisplay();
}

/**
 * הוספת משתתף חדש
 */
function addNewParticipant() {
    // יצירת מזהה ייחודי למשתתף
    const participantId = Date.now();
    
    // יצירת אובייקט משתתף חדש
    const newParticipant = {
        id: participantId,
        name: '',
        email: '',
        phone: ''
    };
    
    // הוספת המשתתף למערך
    participants.push(newParticipant);
    
    // שמירה ב-localStorage
    localStorage.setItem('participants', JSON.stringify(participants));
    
    // עדכון התצוגה
    updateParticipantsDisplay();
    
    // עדכון מספר המשתתפים והמחיר
    updateTotalParticipants();
    
    // הצגת הודעה
    showMessage('משתתף חדש נוסף בהצלחה', 'success');
}

/**
 * הסרת משתתף
 * @param {number} participantId - מזהה המשתתף להסרה
 */
function removeParticipant(participantId) {
    // מציאת האינדקס של המשתתף במערך
    const index = participants.findIndex(p => p.id === participantId);
    
    if (index !== -1) {
        // הסרת המשתתף מהמערך
        participants.splice(index, 1);
        
        // שמירה ב-localStorage
        localStorage.setItem('participants', JSON.stringify(participants));
        
        // עדכון התצוגה
        updateParticipantsDisplay();
        
        // עדכון מספר המשתתפים והמחיר
        updateTotalParticipants();
        
        // הצגת הודעה
        showMessage('המשתתף הוסר בהצלחה', 'info');
    }
}

/**
 * עדכון תצוגת המשתתפים
 */
function updateParticipantsDisplay() {
    const container = document.getElementById('participants-container');
    
    if (!container) {
        return;
    }
    
    // ניקוי התוכן הקיים
    container.innerHTML = '';
    
    // הוספת כל המשתתפים לתצוגה
    participants.forEach(participant => {
        const participantElement = document.createElement('div');
        participantElement.className = 'participant-item';
        participantElement.dataset.id = participant.id;
        
        participantElement.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="participant-name-${participant.id}">שם מלא *</label>
                    <input type="text" id="participant-name-${participant.id}" value="${participant.name || ''}" 
                           onchange="updateParticipantField(${participant.id}, 'name', this.value)" required>
                </div>
                <div class="form-group">
                    <label for="participant-email-${participant.id}">דוא"ל</label>
                    <input type="email" id="participant-email-${participant.id}" value="${participant.email || ''}" 
                           onchange="updateParticipantField(${participant.id}, 'email', this.value)">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="participant-phone-${participant.id}">טלפון נייד</label>
                    <input type="tel" id="participant-phone-${participant.id}" value="${participant.phone || ''}" 
                           onchange="updateParticipantField(${participant.id}, 'phone', this.value)">
                </div>
                <button type="button" class="remove-participant" onclick="removeParticipant(${participant.id})">×</button>
            </div>
        `;
        
        container.appendChild(participantElement);
    });
}

/**
 * עדכון שדה של משתתף
 * @param {number} participantId - מזהה המשתתף
 * @param {string} field - שם השדה לעדכון
 * @param {string} value - הערך החדש
 */
function updateParticipantField(participantId, field, value) {
    // מציאת המשתתף במערך
    const participant = participants.find(p => p.id === participantId);
    
    if (participant) {
        // עדכון השדה
        participant[field] = value;
        
        // שמירה ב-localStorage
        localStorage.setItem('participants', JSON.stringify(participants));
    }
}

/**
 * עדכון מספר המשתתפים הכולל והמחיר
 */
function updateTotalParticipants() {
    // חישוב מספר המשתתפים הכולל (המשתמש הראשי + משתתפים נוספים)
    const totalParticipants = 1 + participants.length;
    
    // עדכון התצוגה
    const totalParticipantsElement = document.getElementById('total-participants');
    if (totalParticipantsElement) {
        totalParticipantsElement.textContent = totalParticipants;
    }
    
    // קביעת המחיר לפי מספר המשתתפים
    let pricePerUnit;
    if (totalParticipants >= 10) {
        pricePerUnit = prices.large;
    } else if (totalParticipants >= 5) {
        pricePerUnit = prices.medium;
    } else {
        pricePerUnit = prices.regular;
    }
    
    // עדכון תצוגת המחיר
    const pricePerUnitElement = document.getElementById('price-per-unit');
    if (pricePerUnitElement) {
        pricePerUnitElement.textContent = `₪${pricePerUnit.toLocaleString()}`;
    }
    
    return { totalParticipants, pricePerUnit };
}

/**
 * שליחת פרטי המשתמש ומעבר לשלב הבא
 */
function submitUserDetails() {
    // בדיקת תקינות הטופס
    const form = document.getElementById('userDetailsForm');
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showMessage('יש למלא את כל השדות החובה', 'error');
        return;
    }
    
    // שמירת פרטי המשתמש
    userData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };
    
    // שמירה ב-localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // בדיקת תקינות פרטי המשתתפים הנוספים
    let participantsValid = true;
    participants.forEach(participant => {
        if (!participant.name) {
            participantsValid = false;
            showMessage('יש למלא את שם המשתתף', 'error');
        }
    });
    
    if (!participantsValid) {
        return;
    }
    
    // מעבר לשלב הבא
    showStep(3);
}

// ===== פונקציות לשלב 3: סיכום =====

/**
 * עדכון דף הסיכום
 */
function updateSummary() {
    // עדכון פרטי המשתמש
    const userSummary = document.getElementById('user-summary');
    if (userSummary) {
        userSummary.innerHTML = `
            <div class="summary-row">
                <span>שם מלא:</span>
                <span>${userData.fullName || ''}</span>
            </div>
            <div class="summary-row">
                <span>דוא"ל:</span>
                <span>${userData.email || ''}</span>
            </div>
            <div class="summary-row">
                <span>טלפון:</span>
                <span>${userData.phone || ''}</span>
            </div>
            <div class="summary-row">
                <span>כתובת:</span>
                <span>${userData.address || ''}</span>
            </div>
        `;
    }
    
    // עדכון פרטי המשתתפים הנוספים
    const participantsSummary = document.getElementById('participants-summary');
    if (participantsSummary) {
        if (participants.length === 0) {
            participantsSummary.innerHTML = '<p>לא נוספו משתתפים נוספים</p>';
        } else {
            let html = '';
            participants.forEach((participant, index) => {
                html += `
                    <div class="summary-row">
                        <span>משתתף ${index + 1}:</span>
                        <span>${participant.name} (${participant.phone || 'ללא טלפון'})</span>
                    </div>
                `;
            });
            participantsSummary.innerHTML = html;
        }
    }
    
    // חישוב מחירים
    const { totalParticipants, pricePerUnit } = updateTotalParticipants();
    const totalPrice = totalParticipants * pricePerUnit;
    const regularPrice = prices.regular * totalParticipants;
    const discount = regularPrice - totalPrice;
    
    // עדכון סיכום המחירים
    document.getElementById('summary-units').textContent = totalParticipants;
    document.getElementById('summary-price-per-unit').textContent = `₪${pricePerUnit.toLocaleString()}`;
    document.getElementById('summary-discount').textContent = `₪${discount.toLocaleString()}`;
    document.getElementById('summary-total').textContent = `₪${totalPrice.toLocaleString()}`;
}

// ===== פונקציות לשלב 4: תשלום =====

/**
 * עדכון דף התשלום
 */
function updatePayment() {
    // חישוב הסכום לתשלום
    const { totalParticipants, pricePerUnit } = updateTotalParticipants();
    const totalPrice = totalParticipants * pricePerUnit;
    
    // עדכון סכום התשלום
    document.getElementById('payment-total').textContent = `₪${totalPrice.toLocaleString()}`;
    
    // הוספת מאזינים לשיטות התשלום
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // הסרת המחלקה active מכל השיטות
            paymentMethods.forEach(m => m.classList.remove('active'));
            // הוספת המחלקה active לשיטה שנבחרה
            this.classList.add('active');
            
            // סימון הרדיו בוטון
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
        });
    });
}

/**
 * סימולציה של תהליך תשלום
 */
function simulatePayment() {
    // בדיקת תקינות טופס התשלום
    const form = document.getElementById('payment-form');
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showMessage('יש למלא את כל שדות התשלום', 'error');
        return;
    }
    
    // הצגת אנימציית טעינה
    showMessage('מעבד את התשלום...', 'info');
    
    // סימולציה של עיבוד תשלום
    setTimeout(() => {
        // יצירת מספר הזמנה אקראי
        const orderNumber = 'GRP-' + Math.floor(10000 + Math.random() * 90000);
        
        // הגדרת תאריך ההזמנה
        const today = new Date();
        const orderDate = today.toLocaleDateString('he-IL');
        
        // עדכון פרטי ההזמנה
        document.getElementById('order-number').textContent = orderNumber;
        document.getElementById('order-date').textContent = orderDate;
        
        // חישוב הסכום ששולם
        const { totalParticipants, pricePerUnit } = updateTotalParticipants();
        const totalPrice = totalParticipants * pricePerUnit;
        document.getElementById('order-amount').textContent = `₪${totalPrice.toLocaleString()}`;
        
        // מעבר לשלב הצלחת תשלום
        showStep(5);
        
        // הצגת הודעת הצלחה
        showMessage('התשלום בוצע בהצלחה!', 'success');
    }, 2000);
}

/**
 * איפוס התהליך וחזרה לדף הבית
 */
function resetProcess() {
    // איפוס הנתונים
    currentStep = 1;
    participants = [];
    userData = {};
    
    // מחיקת הנתונים מ-localStorage
    localStorage.removeItem('currentStep');
    localStorage.removeItem('userData');
    localStorage.removeItem('participants');
    
    // חזרה לדף הבית
    showStep(1);
    
    // הצגת הודעה
    showMessage('התהליך אופס בהצלחה', 'info');
}

// ===== פונקציות עזר =====

/**
 * בדיקת תקינות שדה
 * @param {HTMLElement} field - השדה לבדיקה
 * @returns {boolean} - האם השדה תקין
 */
function validateField(field) {
    // אם השדה אינו חובה וריק, הוא תקין
    if (!field.hasAttribute('required') && !field.value) {
        field.classList.remove('invalid');
        return true;
    }
    
    // בדיקת תקינות לפי סוג השדה
    let isValid = true;
    
    switch (field.type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(field.value);
            break;
        case 'tel':
            const phoneRegex = /^0[2-9]\d{7,8}$/;
            isValid = phoneRegex.test(field.value);
            break;
        default:
            isValid = field.value.trim() !== '';
    }
    
    // הוספת או הסרת מחלקת invalid בהתאם לתקינות
    if (isValid) {
        field.classList.remove('invalid');
    } else {
        field.classList.add('invalid');
    }
    
    return isValid;
}

/**
 * הצגת הודעה למשתמש
 * @param {string} text - תוכן ההודעה
 * @param {string} type - סוג ההודעה (success, error, info)
 */
function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    
    // יצירת אלמנט ההודעה
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.innerHTML = `
        ${text}
        <button class="message-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // הוספת ההודעה למיכל
    messageContainer.appendChild(messageElement);
    
    // הסרת ההודעה אוטומטית לאחר 5 שניות
    setTimeout(() => {
        if (messageElement.parentElement) {
            messageElement.remove();
        }
    }, 5000);
}
