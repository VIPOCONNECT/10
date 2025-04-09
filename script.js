// משתנים גלובליים
let currentStep = 1;
let basePrice = 5000;
let finalPrice = basePrice;
let registrationFee = 100;
let totalParticipants = 200;
let isValid = false;
let referralCode = null; // קוד ההפניה של המשתמש הנוכחי

// אתחול האתר
document.addEventListener('DOMContentLoaded', function() {
    console.log('האתר נטען');
    
    // בדיקה אם המשתמש הגיע דרך קוד הפניה
    checkReferralCode();
    
    // יצירת מזהה סשן ייחודי לסנכרון
    if (!window.sessionId) {
        window.sessionId = Math.random().toString(36).substring(2, 15);
        console.log('נוצר מזהה סשן חדש:', window.sessionId);
    }
    
    // אתחול טופס כרטיס אשראי בטעינת הדף
    setupCreditCardForm();
    
    // בדיקה אם המכשיר הוא מובייל
    checkIfMobile();
    
    // בעת רענון הדף המשתמש תמיד יחזור לשלב הראשון
    const initialStep = 1;
    
    // מחיקת השלב השמור אם קיים
    if (localStorage.getItem('currentStep')) {
        localStorage.removeItem('currentStep');
    }
    console.log('שלב התחלתי:', initialStep);
    
    // אתחול הטיימר
    startCountdown();
    
    // עדכון מספר המשתתפים והמחיר
    updateTotalParticipants();
    updateParticipantsDisplay();
    
    // הוספת מאזינים לכפתורים
    setupEventListeners();
    
    // אתחול טופס מילוי פרטים
    setupUserDetailsForm();
    
    // הוספת מאזינים לאירועי מגע במובייל
    setupTouchEvents();
    
    // הצגת השלב הראשון (או השלב השמור)
    // חשוב: קריאה זו חייבת להיות אחרי setupTouchEvents
    showStep(initialStep);
    
    // הוספת מאזין לאירוע סנכרון משתתפים
    window.addEventListener('participantSync', function(e) {
        if (e.detail && e.detail.participants) {
            console.log('קיבלתי אירוע סנכרון משתתפים:', e.detail.participants);
            totalParticipants = e.detail.participants;
            updateParticipantsDisplay();
            updatePriceBasedOnParticipants();
        }
    });
    
    // הוספת מאזין לאירוע סנכרון פרטי משתמש
    window.addEventListener('userDetailsSync', function(e) {
        if (e.detail && e.detail.userDetails) {
            const syncedDetails = e.detail.userDetails;
            const currentSyncVersion = parseInt(localStorage.getItem('userDetailsSyncVersion') || '0');
            const incomingSyncVersion = parseInt(e.detail.syncVersion || '0');
            
            console.log('קיבלתי אירוע סנכרון פרטי משתמש גרסה:', incomingSyncVersion, 'גרסה נוכחית:', currentSyncVersion);
            
            // עדכון רק אם הגרסה הנכנסת חדשה יותר
            if (incomingSyncVersion > currentSyncVersion) {
                console.log('מעדכן פרטי משתמש לגרסה חדשה:', incomingSyncVersion);
                
                // עדכון האחסון המקומי
                localStorage.setItem('userDetails', JSON.stringify(syncedDetails));
                localStorage.setItem('userDetailsSyncVersion', incomingSyncVersion.toString());
                sessionStorage.setItem('userDetails', JSON.stringify(syncedDetails));
                sessionStorage.setItem('userDetailsSyncVersion', incomingSyncVersion.toString());
                
                // עדכון הממשק אם נמצאים בשלב המתאים
                if (currentStep === 2) {
                    // מילוי שדות הטופס אם נמצאים בשלב הזה
                    fillUserDetailsForm(syncedDetails);
                } else if (currentStep === 3) {
                    // עדכון הסיכום אם נמצאים בשלב הזה
                    updateSummary();
                }
                
                // הצגת הודעה למשתמש רק אם זה ממכשיר אחר
                if (syncedDetails.sessionId !== window.sessionId) {
                    showMessage('פרטי המשתמש סונכרנו ממכשיר ' + syncedDetails.deviceType, 'info');
                }
            }
        }
    });
    
    // בדיקת סנכרון פרטי משתמש בטעינה
    const savedUserDetails = localStorage.getItem('userDetails');
    if (savedUserDetails) {
        try {
            const userDetails = JSON.parse(savedUserDetails);
            console.log('נטענו פרטי משתמש מהאחסון:', userDetails);
            
            // שליחת אירוע סנכרון כדי לוודא שכל החלונות מסונכרנים
            const syncEvent = new CustomEvent('userDetailsSync', { 
                detail: { 
                    userDetails: userDetails,
                    syncVersion: localStorage.getItem('userDetailsSyncVersion') || '1'
                } 
            });
            window.dispatchEvent(syncEvent);
        } catch (e) {
            console.log('שגיאה בטעינת פרטי משתמש:', e);
        }
    }
});

// פונקציה לבדיקה אם המכשיר הוא מובייל
function checkIfMobile() {
    // בדיקה לפי User Agent - בדיקה מקיפה יותר
    const uaCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i.test(navigator.userAgent);
    
    // בדיקה לפי רוחב המסך
    const screenCheck = window.innerWidth <= 768;
    
    // בדיקה לפי יכולות מגע
    const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // בדיקה נוספת למכשירים ניידים
    const mobileOrTablet = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4));
    
    // קביעה סופית - מכשיר נחשב מובייל אם עובר לפחות שתיים מהבדיקות
    let mobileCount = 0;
    if (uaCheck) mobileCount++;
    if (screenCheck) mobileCount++;
    if (touchCheck) mobileCount++;
    if (mobileOrTablet) mobileCount++;
    
    // אם יש סימנים מובהקים למובייל, נזהה אותו כמובייל
    window.isMobile = mobileCount >= 2 || uaCheck || mobileOrTablet;
    
    // אם זה מובייל, נבצע התאמות
    if (window.isMobile) {
        document.body.classList.add('mobile-device');
        document.documentElement.classList.add('mobile-device');
        console.log('זוהה מכשיר מובייל', {
            userAgent: uaCheck,
            screenWidth: screenCheck,
            touchCapable: touchCheck,
            mobileOrTablet: mobileOrTablet
        });
        
        // הוספת מטא תג למניעת זום
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        
        // הוספת מאזינים לאירועי מסך
        window.addEventListener('resize', function() {
            // עדכון המצב בעת שינוי גודל המסך
            if (window.innerWidth <= 768) {
                document.body.classList.add('mobile-view');
            } else {
                document.body.classList.remove('mobile-view');
            }
        });
        
        // הוספת סגנון גלובלי למובייל
        const mobileStyle = document.createElement('style');
        mobileStyle.innerHTML = `
            .step {
                display: none;
                opacity: 1 !important;
                visibility: visible !important;
                height: auto !important;
                overflow: visible !important;
            }
            .step.active {
                display: block !important;
            }
        `;
        document.head.appendChild(mobileStyle);
    } else {
        document.body.classList.add('desktop-device');
        document.documentElement.classList.add('desktop-device');
        console.log('זוהה מחשב');
    }
    
    // הדפסת מידע נוסף לצורך דיבאג
    console.log('מידע על המכשיר:', {
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        isMobile: window.isMobile
    });
}

// פונקציה להוספת מאזינים לאירועי מגע במובייל
function setupTouchEvents() {
    // אם זה מכשיר מובייל, הוסף מאזינים לאירועי מגע
    if (window.isMobile) {
        console.log('מגדיר אירועי מגע למובייל');
        
        // זיהוי סוג המכשיר - אייפון או אנדרואיד
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);
        console.log('סוג מכשיר:', isIOS ? 'iOS' : isAndroid ? 'Android' : 'אחר');
        
        // הסרת המאפיין onclick מכל הכפתורים והחלפתו במאזינים
        const allButtons = document.querySelectorAll('button[onclick]');
        console.log('מספר כפתורים עם onclick:', allButtons.length);
        
        allButtons.forEach(button => {
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                // שמירת הפעולה המקורית
                let action = null;
                
                try {
                    if (onclickAttr.includes('showStep')) {
                        const stepMatch = onclickAttr.match(/showStep\((\d+)\)/);
                        if (stepMatch && stepMatch[1]) {
                            const stepNumber = parseInt(stepMatch[1]);
                            action = function(e) {
                                if (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                                console.log('מעבר לשלב במובייל:', stepNumber);
                                showStep(stepNumber);
                                return false;
                            };
                        }
                    } else if (onclickAttr.includes('submitUserDetails')) {
                        action = function(e) {
                            if (e) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            submitUserDetails();
                            return false;
                        };
                    } else if (onclickAttr.includes('addNewParticipant')) {
                        action = function(e) {
                            if (e) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            addNewParticipant();
                            return false;
                        };
                    } else if (onclickAttr.includes('simulatePayment')) {
                        action = function(e) {
                            if (e) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            simulatePayment();
                            return false;
                        };
                    }
                    
                    if (action) {
                        // הסרת המאפיין onclick והחלפתו במאזינים
                        button.removeAttribute('onclick');
                        
                        // הוספת מאזין לחיצה רגילה
                        button.addEventListener('click', action);
                        
                        // הוספת מאזינים למגע
                        button.addEventListener('touchstart', function(e) {
                            this.classList.add('touch-active');
                        }, { passive: true });
                        
                        button.addEventListener('touchend', function(e) {
                            this.classList.remove('touch-active');
                            action(e);
                        });
                        
                        console.log('הוספת מאזינים לכפתור:', onclickAttr);
                    }
                } catch (error) {
                    console.error('שגיאה בהגדרת אירועים לכפתור:', error, onclickAttr);
                }
            }
        });
        
        // הוספת מאזינים לסרגל ההתקדמות
        const progressSteps = document.querySelectorAll('.progress-step');
        progressSteps.forEach(step => {
            const stepNumber = parseInt(step.getAttribute('data-step') || '1');
            const action = function(e) {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                console.log('מעבר לשלב מסרגל התקדמות:', stepNumber);
                showStep(stepNumber);
                return false;
            };
            
            // הסרת מאזינים קיימים
            step.replaceWith(step.cloneNode(true));
            
            // קבלת האלמנט החדש
            const newStep = document.querySelector(`.progress-step[data-step="${stepNumber}"]`);
            
            // הוספת מאזינים חדשים
            newStep.addEventListener('click', action);
            newStep.addEventListener('touchend', action);
        });
        
        // הוספת מאזין לאירועי גלילה במובייל
        document.addEventListener('touchmove', function(e) {
            // אם יש צורך בטיפול מיוחד בגלילה
        }, { passive: true });
        
        // התאמות ספציפיות לאייפון
        if (isIOS) {
            // התאמות ספציפיות ל-iOS
            document.documentElement.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
            document.documentElement.style.webkitTouchCallout = 'none';
            document.documentElement.style.webkitUserSelect = 'none';
        }
        
        // התאמות ספציפיות לאנדרואיד
        if (isAndroid) {
            // התאמות ספציפיות לאנדרואיד
            document.documentElement.style.userSelect = 'none';
        }
        
        // הוספת סגנון CSS להצגת השלבים במובייל
        const mobileStyle = document.createElement('style');
        mobileStyle.textContent = `
            .step {
                display: none !important;
                opacity: 1 !important;
                visibility: visible !important;
                height: auto !important;
                overflow: visible !important;
            }
            .step.active {
                display: block !important;
            }
        `;
        document.head.appendChild(mobileStyle);
        
        // הצגת השלב הראשון בעת רענון
        setTimeout(() => {
            showStep(1);
        }, 100);
    }
}

// פונקציה להצגת שלב מסוים
function showStep(stepNumber) {
    console.log('מעבר לשלב:', stepNumber);
    
    // עדכון מספר המשתתפים והמחירים לפני מעבר בין שלבים
    updateTotalParticipants();
    updateParticipantsDisplay();
    
    // הסתרת כל השלבים
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none'; // הסתרה מפורשת בעזרת CSS
    });
    
    // הצגת השלב הנבחר
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    if (currentStepElement) {
        // שמירת השלב הנוכחי במשתנה גלובלי בלבד (ללא שמירה ב-localStorage)
        currentStep = stepNumber;
        
        // אין שמירה של השלב ב-localStorage כדי שברענון יחזור לשלב הראשון
        
        // עדכון סרגל ההתקדמות
        updateProgressBar(stepNumber);
        
        // הצגת השלב הנוכחי
        currentStepElement.classList.add('active');
        currentStepElement.style.display = 'block'; // הצגה מפורשת בעזרת CSS
        
        // אם זה שלב 2, אתחל את טופס מילוי הפרטים ועדכן את האזור האישי
        if (stepNumber === 2) {
            updateUserArea();
        }
        
        // אם זה שלב 3, עדכן את הסיכום וקישור ההפניה
        if (stepNumber === 3) {
            updateSummary();
            // עדכון קישור ההפניה בשלב 3
            updateReferralLinkStep3();
        }
        
        // אם זה שלב 4, עדכן את התשלום
        if (stepNumber === 4) {
            updatePayment();
        }
        
        // הצגת הודעה למשתמש במובייל
        if (window.isMobile) {
            showMessage(`מעבר לשלב ${stepNumber}`, 'info');
            
            // תיקון מיוחד למובייל - וידוא שהשלב מוצג כראוי
            setTimeout(() => {
                // וידוא שהשלב מוצג
                if (currentStepElement.style.display !== 'block') {
                    currentStepElement.style.display = 'block';
                }
                if (!currentStepElement.classList.contains('active')) {
                    currentStepElement.classList.add('active');
                }
                
                // הסרת כל הסגנונות המסתירים
                currentStepElement.style.opacity = '1';
                currentStepElement.style.visibility = 'visible';
                currentStepElement.style.height = 'auto';
                currentStepElement.style.overflow = 'visible';
                
                console.log('וידוא תצוגת שלב במובייל:', stepNumber);
                
                // וידוא נוסף לאחר זמן קצר
                setTimeout(() => {
                    if (currentStepElement.style.display !== 'block') {
                        currentStepElement.style.display = 'block';
                        currentStepElement.classList.add('active');
                        console.log('תיקון תצוגת שלב במובייל (ניסיון שני):', stepNumber);
                    }
                }, 500);
            }, 100);
        }
    } else {
        console.error(`לא נמצא אלמנט עם ID: step${stepNumber}`);
    }
    
    // גלילה לראש העמוד
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// פונקציה לעדכון סרגל ההתקדמות
function updateProgressBar(stepNumber) {
    const progressSteps = document.querySelectorAll('.progress-step');
    
    progressSteps.forEach((step, index) => {
        // מספר השלב הוא index + 1
        const stepNum = index + 1;
        
        // איפוס כל הסטטוסים
        step.classList.remove('active', 'completed');
        
        // אם זה השלב הנוכחי
        if (stepNum === stepNumber) {
            step.classList.add('active');
        }
        // אם זה שלב שכבר הושלם
        else if (stepNum < stepNumber) {
            step.classList.add('completed');
        }
    });
}

// פונקציה לעדכון האזור האישי (שלב 2)
function updateUserArea() {
    // בדיקה אם יש פרטי משתמש שמורים
    const savedUserDetails = localStorage.getItem('userDetails');
    if (savedUserDetails) {
        const userDetails = JSON.parse(savedUserDetails);
        // מילוי הטופס בפרטים השמורים
        document.getElementById('first-name').value = userDetails.firstName || '';
        document.getElementById('last-name').value = userDetails.lastName || '';
        document.getElementById('phone').value = userDetails.phone || '';
        document.getElementById('email').value = userDetails.email || '';
        document.getElementById('city').value = userDetails.city || '';
        document.getElementById('street').value = userDetails.street || '';
        document.getElementById('house-number').value = userDetails.houseNumber || '';
        
        // בחירת אפשרות משלוח
        if (userDetails.deliveryMethod) {
            document.querySelector(`input[name="delivery-method"][value="${userDetails.deliveryMethod}"]`).checked = true;
        }
    }
}

// פונקציה לעדכון כמות המשתתפים עם סנכרון משופר
function updateTotalParticipants() {
    // בדיקה אם יש מספר משתתפים שמור ב-localStorage
    const savedParticipants = localStorage.getItem('totalParticipants');
    const lastSyncTime = localStorage.getItem('lastParticipantSyncTime');
    const currentTime = new Date().getTime();
    
    // בדיקה אם יש צורך בסנכרון מהשרת (במקרה של אתר אמיתי עם שרת)
    // בסימולציה שלנו נשתמש ב-localStorage כשרת
    const shouldSyncFromServer = !lastSyncTime || (currentTime - parseInt(lastSyncTime)) > 60000; // סנכרון כל דקה
    
    // אם יש מספר שמור ולא צריך סנכרון מהשרת
    if (savedParticipants && !shouldSyncFromServer) {
        totalParticipants = parseInt(savedParticipants);
        console.log('משתמש במספר משתתפים מה-localStorage:', totalParticipants);
    } else {
        // סימולציה של סנכרון מהשרת או יצירת מספר חדש
        console.log('מסנכרן מספר משתתפים מהשרת...');
        
        // אם יש מספר שמור, נשתמש בו כבסיס ונוסיף מספר אקראי של משתתפים חדשים
        if (savedParticipants) {
            const currentParticipants = parseInt(savedParticipants);
            // הוספת מספר אקראי של משתתפים חדשים בין 0 ל-3
            const newParticipants = Math.floor(Math.random() * 4);
            totalParticipants = currentParticipants + newParticipants;
            console.log('התווספו', newParticipants, 'משתתפים חדשים');
        } else {
            // אם אין מספר שמור, ניצור מספר חדש לפי הזמן שעבר מתחילת הקמפיין
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 5); // נניח שהקמפיין התחיל לפני 5 ימים
            
            const now = new Date();
            const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            
            // נתחיל מ-200 רשומים ונוסיף עוד משתתפים לפי הזמן שעבר
            totalParticipants = 200 + (daysPassed * 15);
            console.log('יצירת מספר משתתפים חדש:', totalParticipants);
        }
        
        // עדכון זמן הסנכרון האחרון
        localStorage.setItem('lastParticipantSyncTime', currentTime.toString());
    }
    
    // שמירת המספר המעודכן ב-localStorage
    localStorage.setItem('totalParticipants', totalParticipants.toString());
    
    // שמירת המספר המעודכן גם ב-sessionStorage לסנכרון בין טאבים
    sessionStorage.setItem('totalParticipants', totalParticipants.toString());
    
    console.log('מספר המשתתפים הנוכחי:', totalParticipants);
    
    // הוספת מאזינים לסנכרון בין טאבים/מכשירים
    if (!window.storageListenerAdded) {
        // מאזין לשינויים ב-localStorage
        window.addEventListener('storage', function(e) {
            if (e.key === 'totalParticipants' && e.newValue) {
                console.log('סנכרון מספר משתתפים בין מכשירים:', e.newValue);
                totalParticipants = parseInt(e.newValue);
                updateParticipantsDisplay();
                updatePriceBasedOnParticipants();
            }
        });
        
        // הגדרת בדיקת סנכרון תקופתית
        setInterval(function() {
            // בדיקה אם יש שינוי ב-sessionStorage שאינו תואם את המשתנה הגלובלי
            const sessionParticipants = sessionStorage.getItem('totalParticipants');
            if (sessionParticipants && parseInt(sessionParticipants) !== totalParticipants) {
                console.log('סנכרון מספר משתתפים מ-sessionStorage:', sessionParticipants);
                totalParticipants = parseInt(sessionParticipants);
                updateParticipantsDisplay();
                updatePriceBasedOnParticipants();
            }
            
            // בדיקה אם יש שינוי ב-localStorage שאינו תואם את המשתנה הגלובלי
            const localParticipants = localStorage.getItem('totalParticipants');
            if (localParticipants && parseInt(localParticipants) !== totalParticipants) {
                console.log('סנכרון מספר משתתפים מ-localStorage:', localParticipants);
                totalParticipants = parseInt(localParticipants);
                updateParticipantsDisplay();
                updatePriceBasedOnParticipants();
            }
        }, 5000); // בדיקה כל 5 שניות
        
        window.storageListenerAdded = true;
    }
    
    // יצירת אירוע מותאם לסנכרון בין חלונות באותו מכשיר
    try {
        const syncEvent = new CustomEvent('participantSync', { 
            detail: { participants: totalParticipants } 
        });
        window.dispatchEvent(syncEvent);
    } catch (e) {
        console.log('שגיאה בשליחת אירוע סנכרון:', e);
    }
}

// פונקציה לעדכון כל התצוגות של מספר המשתתפים והמחירים באתר
function updateParticipantsDisplay() {
    // עדכון מספר המשתתפים בכל המקומות באתר
    document.getElementById('participants-count').textContent = totalParticipants;
    
    // עדכון בשלב 2
    const step2Counter = document.getElementById('participants-count-step2');
    if (step2Counter) {
        step2Counter.textContent = totalParticipants;
    }
    
    // עדכון בשלב 3
    const step3Counter = document.getElementById('participants-count-step3');
    if (step3Counter) {
        step3Counter.textContent = totalParticipants;
    }
    
    // עדכון בשלב 4
    const step4Counter = document.getElementById('participants-count-step4');
    if (step4Counter) {
        step4Counter.textContent = totalParticipants;
    }
    
    // עדכון המחיר בהתאם למספר המשתתפים
    updatePriceBasedOnParticipants();
}

// פונקציה לעדכון המחיר בהתאם לכמות המשתתפים
function updatePriceBasedOnParticipants() {
    // חישוב המחיר לפי מספר המשתתפים
    if (totalParticipants <= 100) {
        finalPrice = 5000;
    } else if (totalParticipants <= 200) {
        finalPrice = 4500;
    } else if (totalParticipants <= 300) {
        finalPrice = 4000;
    } else if (totalParticipants <= 400) {
        finalPrice = 3500;
    } else {
        finalPrice = 3000;
    }
    
    // עדכון המחיר המוצג
    const currentPriceElement = document.getElementById('current-price');
    if (currentPriceElement) {
        currentPriceElement.textContent = `₪${finalPrice.toLocaleString()}`;
    }
}

// פונקציה לעדכון הסיכום (שלב 3)
function updateSummary() {
    // בדיקה אם יש פרטי משתמש שמורים
    const savedUserDetails = localStorage.getItem('userDetails');
    if (!savedUserDetails) {
        // אם אין פרטים, חזור לשלב 2
        showStep(2);
        return;
    }
    
    const userDetails = JSON.parse(savedUserDetails);
    
    // עדכון פרטי המשתמש בסיכום
    document.getElementById('summary-name').textContent = `${userDetails.firstName} ${userDetails.lastName}`;
    document.getElementById('summary-phone').textContent = userDetails.phone;
    document.getElementById('summary-email').textContent = userDetails.email;
    document.getElementById('summary-address').textContent = `${userDetails.street} ${userDetails.houseNumber}, ${userDetails.city}`;
    
    // עדכון פרטי המשלוח
    const deliveryMethod = userDetails.deliveryMethod === 'express' ? 'משלוח מהיר (₪100)' : 'משלוח רגיל (₪50)';
    document.getElementById('summary-delivery').textContent = deliveryMethod;
    
    // עדכון המחירים
    const shippingCost = userDetails.deliveryMethod === 'delivery' ? 500 : 0;
    const discount = 7000 - finalPrice;
    
    document.getElementById('summary-discount').textContent = `₪${discount.toLocaleString()}`;
    document.getElementById('summary-price').textContent = `₪${finalPrice.toLocaleString()}`;
    document.getElementById('summary-shipping').textContent = shippingCost > 0 ? `₪${shippingCost}` : 'ללא עלות';
    document.getElementById('summary-total').textContent = `₪${(finalPrice + shippingCost).toLocaleString()}`;
}

// פונקציה לעדכון התשלום (שלב 4)
function updatePayment() {
    // עדכון הסכום לתשלום
    const savedUserDetails = localStorage.getItem('userDetails');
    if (savedUserDetails) {
        const userDetails = JSON.parse(savedUserDetails);
        const shippingCost = userDetails.deliveryMethod === 'delivery' ? 500 : 0;
        document.getElementById('finalPayment').textContent = `₪${(finalPrice + shippingCost).toLocaleString()}`;
    }
    
    // אתחול טופס כרטיס אשראי
    setupCreditCardForm();
}

// פונקציה להוספת משתתף חדש עם אנימציות מתקדמות
function addNewParticipant() {
    // הוספת אפקט ויזואלי להצטרפות משתתף חדש
    const participantCounter = document.querySelector('.counter-text span');
    const counterContainer = document.querySelector('.participants-counter');
    
    if (participantCounter && counterContainer) {
        // יצירת אפקט הבהוב והתרחבות
        const originalBackground = window.getComputedStyle(counterContainer).background;
        const originalTransform = window.getComputedStyle(counterContainer).transform;
        const originalBoxShadow = window.getComputedStyle(counterContainer).boxShadow;
        
        // יצירת אפקט הבהוב
        counterContainer.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(139, 195, 74, 0.9))';
        counterContainer.style.transform = 'scale(1.03)';
        counterContainer.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.4)';
        counterContainer.style.transition = 'all 0.3s ease';
        
        // יצירת אפקט הוספת משתתף חדש עם אנימציה
        const newParticipantEffect = document.createElement('div');
        newParticipantEffect.textContent = '+1';
        newParticipantEffect.style.position = 'absolute';
        newParticipantEffect.style.top = '50%';
        newParticipantEffect.style.left = '30%';
        newParticipantEffect.style.transform = 'translate(-50%, -50%)';
        newParticipantEffect.style.color = 'white';
        newParticipantEffect.style.fontSize = '2.5rem';
        newParticipantEffect.style.fontWeight = 'bold';
        newParticipantEffect.style.opacity = '0';
        newParticipantEffect.style.zIndex = '10';
        newParticipantEffect.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
        newParticipantEffect.style.transition = 'all 0.5s ease';
        counterContainer.appendChild(newParticipantEffect);
        
        // הפעלת האנימציה
        setTimeout(() => {
            newParticipantEffect.style.opacity = '1';
            newParticipantEffect.style.transform = 'translate(-50%, -100%)';
            
            setTimeout(() => {
                newParticipantEffect.style.opacity = '0';
                setTimeout(() => {
                    counterContainer.removeChild(newParticipantEffect);
                }, 300);
            }, 800);
        }, 50);
        
        // הוספת משתתף חדש
        totalParticipants++;
        
        // שמירת מספר המשתתפים המעודכן ב-localStorage
        localStorage.setItem('totalParticipants', totalParticipants.toString());
        console.log('מספר המשתתפים המעודכן:', totalParticipants);
        
        // עדכון התצוגה של מספר המשתתפים עם אנימציה
        if (participantCounter) {
            // שמירת הערך הנוכחי של האלמנט
            const originalColor = window.getComputedStyle(participantCounter).color;
            const originalSize = window.getComputedStyle(participantCounter).fontSize;
            
            // הדגשת המספר החדש
            participantCounter.style.color = '#FFEB3B';
            participantCounter.style.fontSize = 'calc(' + originalSize + ' * 1.2)';
            participantCounter.style.transition = 'all 0.3s ease';
            
            // עדכון המספר
            participantCounter.textContent = totalParticipants;
            
            // החזרה לעיצוב המקורי לאחר השהייה
            setTimeout(() => {
                participantCounter.style.color = originalColor;
                participantCounter.style.fontSize = originalSize;
            }, 1000);
        }
        
        // החזרת העיצוב המקורי למיכל המונה
        setTimeout(() => {
            counterContainer.style.background = originalBackground;
            counterContainer.style.transform = originalTransform;
            counterContainer.style.boxShadow = originalBoxShadow;
        }, 1200);
    } else {
        // אם לא נמצאו האלמנטים בדף, פשוט נעדכן את המספר
        totalParticipants++;
        localStorage.setItem('totalParticipants', totalParticipants.toString());
    }
    
    // עדכון כל המחירים בכל הדפים
    updateParticipantsDisplay();
    
    // התאמה למובייל - שינוי סוג ההודעה בהתאם לסוג המכשיר
    let messageType = 'success';
    let messageText = 'משתתף חדש הצטרף! המחיר עודכן.';
    
    // הוספת מידע נוסף למשתמשי מובייל
    if (window.isMobile) {
        messageText += ' השינוי יסונכרן בכל המכשירים שלך.';
    }
    
    // הצגת הודעה למשתמש עם אייקון אנימטיבי
    showMessage(messageText, messageType);
    
    // בדיקה אם המחיר השתנה בעקבות ההצטרפות
    checkPriceThresholds();
    
    // שליחת אירוע מותאם לסנכרון בין חלונות באותו מכשיר
    try {
        // יצירת אירוע מותאם לסנכרון מיידי בין חלונות פתוחים
        const syncEvent = new CustomEvent('participantSync', { 
            detail: { participants: totalParticipants } 
        });
        window.dispatchEvent(syncEvent);
    } catch (e) {
        console.log('שגיאה בשליחת אירוע סנכרון:', e);
    }
}

// פונקציה לבדיקת ספי מחיר
// מציגה הודעה מיוחדת כאשר המחיר יורד לרמה חדשה
function checkPriceThresholds() {
    const thresholds = [100, 200, 300, 400];
    
    // בדיקה אם חצינו סף
    thresholds.forEach(threshold => {
        if (totalParticipants === threshold + 1) {
            // חישוב המחיר החדש
            let newPrice;
            if (threshold === 100) newPrice = 4500;
            else if (threshold === 200) newPrice = 4000;
            else if (threshold === 300) newPrice = 3500;
            else if (threshold === 400) newPrice = 3000;
            
            // הצגת הודעה על הורדת מחיר
            showMessage(`מזל טוב! הגענו ל-${totalParticipants} משתתפים והמחיר ירד ל-₪${newPrice}!`, 'success');
        }
    });
}

// פונקציה להצגת הודעה
function showMessage(message, type = 'success') {
    const messageElement = document.getElementById('message');
    
    // הגדרת סוג ההודעה
    messageElement.className = 'message';
    if (type) {
        messageElement.classList.add(type);
    }
    
    // הגדרת תוכן ההודעה
    messageElement.textContent = message;
    
    // הצגת ההודעה
    messageElement.style.display = 'block';
    
    // הסתרת ההודעה אחרי 3 שניות
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

// פונקציה לשליחת פרטים לוואטסאפ של הלקוח
function sendToCustomerWhatsApp(userDetails) {
    try {
        // הכנת הודעה מפורמטת
        let message = `שלום ${userDetails.firstName},\n\n`;
        message += `תודה על הצטרפותך לרכישה הקבוצתית של כורסת עיסוי Luxury-9900!\n\n`;
        message += `פרטי ההזמנה שלך:\n`;
        message += `שם מלא: ${userDetails.firstName} ${userDetails.lastName}\n`;
        message += `טלפון: ${userDetails.phone}\n`;
        message += `אימייל: ${userDetails.email}\n`;
        message += `כתובת: ${userDetails.street} ${userDetails.houseNumber}, ${userDetails.city}\n`;
        message += `סוג משלוח: ${userDetails.deliveryMethod === 'delivery' ? 'משלוח (₪500)' : 'איסוף עצמי (ללא עלות)'}\n`;
        message += `מחיר סופי: ₪${(finalPrice + (userDetails.deliveryMethod === 'delivery' ? 500 : 0)).toLocaleString()}\n\n`;
        message += `נציג שלנו יצור איתך קשר בהקדם לגבי המשך התהליך.\n`;
        message += `תודה שבחרת להצטרף לקניה החכמה!`;
        
        // הכנת URL לוואטסאפ
        const phoneNumber = userDetails.phone;
        const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        // פתיחת חלון חדש עם הקישור לוואטסאפ
        window.open(whatsappURL, '_blank');
        console.log('נשלחה הודעת וואטסאפ ללקוח');
    } catch (e) {
        console.error('שגיאה בשליחת הודעת וואטסאפ ללקוח:', e);
    }
}

// פונקציה לשליחת פרטים לוואטסאפ של המנהל
function sendToManagerWhatsApp(userDetails) {
    try {
        // הכנת הודעה מפורמטת
        let message = `לקוח חדש הצטרף לרכישה הקבוצתית!\n\n`;
        message += `פרטי הלקוח:\n`;
        message += `שם מלא: ${userDetails.firstName} ${userDetails.lastName}\n`;
        message += `טלפון: ${userDetails.phone}\n`;
        message += `אימייל: ${userDetails.email}\n`;
        message += `כתובת: ${userDetails.street} ${userDetails.houseNumber}, ${userDetails.city}\n`;
        message += `סוג משלוח: ${userDetails.deliveryMethod === 'delivery' ? 'משלוח (₪500)' : 'איסוף עצמי (ללא עלות)'}\n`;
        message += `הערות: ${userDetails.notes || 'אין'}\n`;
        message += `מחיר סופי: ₪${(finalPrice + (userDetails.deliveryMethod === 'delivery' ? 500 : 0)).toLocaleString()}\n\n`;
        message += `זמן הרשמה: ${new Date(userDetails.timestamp).toLocaleString('he-IL')}\n`;
        message += `מכשיר: ${userDetails.deviceType}`;
        
        // הכנת URL לוואטסאפ של המנהל
        const managerPhone = '972587009938'; // מספר הוואטסאפ של המנהל בפורמט בינלאומי
        const whatsappURL = `https://wa.me/${managerPhone}?text=${encodeURIComponent(message)}`;
        
        // פתיחת חלון חדש עם הקישור לוואטסאפ
        window.open(whatsappURL, '_blank');
        console.log('נשלחה הודעת וואטסאפ למנהל');
    } catch (e) {
        console.error('שגיאה בשליחת הודעת וואטסאפ למנהל:', e);
    }
}

// פונקציה לשליחת פרטים למייל של הלקוח
function sendToCustomerEmail(userDetails) {
    try {
        // הכנת הודעה מפורמטת
        let subject = `אישור הצטרפות לרכישה קבוצתית - כורסת עיסוי Luxury-9900`;
        
        let body = `שלום ${userDetails.firstName},\n\n`;
        body += `תודה על הצטרפותך לרכישה הקבוצתית של כורסת עיסוי Luxury-9900!\n\n`;
        body += `פרטי ההזמנה שלך:\n`;
        body += `שם מלא: ${userDetails.firstName} ${userDetails.lastName}\n`;
        body += `טלפון: ${userDetails.phone}\n`;
        body += `אימייל: ${userDetails.email}\n`;
        body += `כתובת: ${userDetails.street} ${userDetails.houseNumber}, ${userDetails.city}\n`;
        body += `סוג משלוח: ${userDetails.deliveryMethod === 'delivery' ? 'משלוח (₪500)' : 'איסוף עצמי (ללא עלות)'}\n`;
        body += `מחיר סופי: ₪${(finalPrice + (userDetails.deliveryMethod === 'delivery' ? 500 : 0)).toLocaleString()}\n\n`;
        body += `נציג שלנו יצור איתך קשר בהקדם לגבי המשך התהליך.\n\n`;
        body += `תודה שבחרת להצטרף לקניה החכמה!\n\n`;
        body += `בברכה,\nצוות הרכישה הקבוצתית`;
        
        // הכנת URL למייל
        const mailtoURL = `mailto:${userDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // פתיחת חלון חדש עם הקישור למייל
        window.open(mailtoURL, '_blank');
        console.log('נשלח מייל ללקוח');
    } catch (e) {
        console.error('שגיאה בשליחת מייל ללקוח:', e);
    }
}

// פונקציה לשליחת פרטים למייל של המנהל
function sendToManagerEmail(userDetails) {
    try {
        // הכנת הודעה מפורמטת
        let subject = `לקוח חדש ברכישה הקבוצתית - ${userDetails.firstName} ${userDetails.lastName}`;
        
        let body = `לקוח חדש הצטרף לרכישה הקבוצתית!\n\n`;
        body += `פרטי הלקוח:\n`;
        body += `שם מלא: ${userDetails.firstName} ${userDetails.lastName}\n`;
        body += `טלפון: ${userDetails.phone}\n`;
        body += `אימייל: ${userDetails.email}\n`;
        body += `כתובת: ${userDetails.street} ${userDetails.houseNumber}, ${userDetails.city}\n`;
        body += `סוג משלוח: ${userDetails.deliveryMethod === 'delivery' ? 'משלוח (₪500)' : 'איסוף עצמי (ללא עלות)'}\n`;
        body += `הערות: ${userDetails.notes || 'אין'}\n`;
        body += `מחיר סופי: ₪${(finalPrice + (userDetails.deliveryMethod === 'delivery' ? 500 : 0)).toLocaleString()}\n\n`;
        body += `זמן הרשמה: ${new Date(userDetails.timestamp).toLocaleString('he-IL')}\n`;
        body += `מכשיר: ${userDetails.deviceType}\n\n`;
        body += `מספר משתתפים נוכחי: ${totalParticipants}`;
        
        // הכנת URL למייל
        const managerEmail = 'vipo.m1985@gmail.com'; // כתובת המייל של המנהל
        const mailtoURL = `mailto:${managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // פתיחת חלון חדש עם הקישור למייל
        window.open(mailtoURL, '_blank');
        console.log('נשלח מייל למנהל');
    } catch (e) {
        console.error('שגיאה בשליחת מייל למנהל:', e);
    }
}

// פונקציה לאתחול הטיימר
function startCountdown() {
    // תאריך התחלת הקמפיין - קבוע לכל המשתמשים
    // הגדרת תאריך התחלה קבוע - 9 באפריל 2025
    const startDate = new Date(2025, 3, 9); // חודש אפריל הוא אינדקס 3 (0-11)
    startDate.setHours(0, 0, 0, 0);
    
    // חישוב תאריך סיום - 31 יום מתאריך ההתחלה
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 31);
    endDate.setHours(23, 59, 59, 0);
    
    // עדכון הטיימר בפעם הראשונה
    updateCountdown(endDate);
    
    // עדכון הטיימר כל שנייה
    setInterval(() => {
        updateCountdown(endDate);
    }, 1000);
}

// פונקציה לעדכון הטיימר
function updateCountdown(endDate) {
    const now = new Date();
    const distance = endDate - now;
    
    // חישוב ימים, שעות, דקות ושניות
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // עדכון הערכים בטיימר הגלובלי
    const globalDaysElement = document.getElementById('global-days');
    const globalHoursElement = document.getElementById('global-hours');
    const globalMinutesElement = document.getElementById('global-minutes');
    const globalSecondsElement = document.getElementById('global-seconds');
    
    if (globalDaysElement) globalDaysElement.textContent = days.toString().padStart(2, '0');
    if (globalHoursElement) globalHoursElement.textContent = hours.toString().padStart(2, '0');
    if (globalMinutesElement) globalMinutesElement.textContent = minutes.toString().padStart(2, '0');
    if (globalSecondsElement) globalSecondsElement.textContent = seconds.toString().padStart(2, '0');
    
    // אם הקמפיין הסתיים
    if (distance < 0) {
        // עדכון הטיימר הגלובלי ל-00
        if (globalDaysElement) globalDaysElement.textContent = '00';
        if (globalHoursElement) globalHoursElement.textContent = '00';
        if (globalMinutesElement) globalMinutesElement.textContent = '00';
        if (globalSecondsElement) globalSecondsElement.textContent = '00';
        
        // הצגת הודעה שהקמפיין הסתיים
        showMessage('הקמפיין הסתיים! ניתן עדיין להצטרף במחיר הנוכחי.', 'info');
    }
}

// פונקציה להחלפת התמונה הראשית עם אנימציות מתקדמות
function changeMainImage(src) {
    const mainImage = document.getElementById('main-product-image');
    const mainImageContainer = mainImage ? mainImage.parentElement : null;
    
    if (mainImage && mainImageContainer) {
        // הוספת אפקט התפוגגות מתקדם לפני ההחלפה
        mainImage.style.opacity = '0';
        mainImage.style.transform = 'scale(0.92) translateY(5px)';
        mainImage.style.filter = 'blur(2px)';
        
        // הוספת אפקט הבהוב לרקע של התמונה
        const flashEffect = document.createElement('div');
        flashEffect.style.position = 'absolute';
        flashEffect.style.top = '0';
        flashEffect.style.left = '0';
        flashEffect.style.width = '100%';
        flashEffect.style.height = '100%';
        flashEffect.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        flashEffect.style.borderRadius = '8px';
        flashEffect.style.opacity = '0';
        flashEffect.style.transition = 'opacity 0.3s ease';
        flashEffect.style.zIndex = '1';
        mainImageContainer.appendChild(flashEffect);
        
        // הפעלת אפקט ההבהוב
        setTimeout(() => {
            flashEffect.style.opacity = '0.7';
            setTimeout(() => {
                flashEffect.style.opacity = '0';
                setTimeout(() => {
                    mainImageContainer.removeChild(flashEffect);
                }, 300);
            }, 100);
        }, 50);
        
        // החלפת התמונה לאחר השהייה קצרה
        setTimeout(() => {
            // סימון התמונה הממוזערת המתאימה כפעילה עם אנימציה משופרת
            const thumbnails = document.querySelectorAll('.thumbnail-images img');
            thumbnails.forEach(thumb => {
                if (thumb.src === src) {
                    // אפקט מתקדם לתמונה הנבחרת
                    thumb.style.borderColor = '#1976D2';
                    thumb.style.transform = 'scale(1.12)';
                    thumb.style.boxShadow = '0 4px 8px rgba(25, 118, 210, 0.4)';
                    thumb.style.zIndex = '2';
                    
                    // החזרה הדרגתית למצב רגיל אך מודגש
                    setTimeout(() => {
                        thumb.style.transform = 'scale(1.05)';
                        thumb.style.boxShadow = '0 2px 5px rgba(25, 118, 210, 0.3)';
                    }, 300);
                } else {
                    thumb.style.borderColor = 'transparent';
                    thumb.style.transform = 'scale(0.95)';
                    thumb.style.boxShadow = 'none';
                    thumb.style.zIndex = '1';
                    
                    // החזרה הדרגתית למצב רגיל
                    setTimeout(() => {
                        thumb.style.transform = 'scale(1)';
                    }, 200);
                }
            });
            
            // החלפת התמונה
            mainImage.src = src;
            
            // החזרת התמונה למצב רגיל עם אנימציה משופרת
            setTimeout(() => {
                mainImage.style.opacity = '1';
                mainImage.style.transform = 'scale(1) translateY(0)';
                mainImage.style.filter = 'blur(0)';
                
                // הוספת אפקט זוהר זמני
                mainImage.style.boxShadow = '0 0 20px rgba(25, 118, 210, 0.5)';
                setTimeout(() => {
                    mainImage.style.boxShadow = 'none';
                }, 500);
            }, 100);
        }, 250);
    }
}

// פונקציה לאתחול טופס מילוי פרטים
function setupUserDetailsForm() {
    // קבלת כל השדות בטופס
    const formInputs = document.querySelectorAll('#user-details-form input, #user-details-form textarea');
    
    // הוספת מאזינים לשינויים בשדות
    formInputs.forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('blur', validateForm);
    });
    
    // פונקציה לבדיקת תקינות הטופס
    function validateForm() {
        isValid = true;
        
        // בדיקת שדות חובה
        const requiredFields = [
            'first-name',
            'last-name',
            'phone',
            'email',
            'city',
            'street',
            'house-number'
        ];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        // בדיקת תקינות דוא"ל
        const emailField = document.getElementById('email');
        if (emailField && emailField.value.trim()) {
            if (!validateEmail(emailField.value)) {
                emailField.classList.add('error');
                isValid = false;
            }
        }
        
        // בדיקת תקינות טלפון
        const phoneField = document.getElementById('phone');
        if (phoneField && phoneField.value.trim()) {
            if (!validatePhone(phoneField.value)) {
                phoneField.classList.add('error');
                isValid = false;
            }
        }
    }
    
    // פונקציה לבדיקת תקינות דוא"ל
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // פונקציה לבדיקת תקינות טלפון
    function validatePhone(phone) {
        const phoneRegex = /^0[2-9]\d{7,8}$/;
        return phoneRegex.test(phone);
    }
    
    // פונקציה לשמירת פרטי המשתמש עם סנכרון מלא
    function saveUserDetails() {
        // איסוף כל פרטי המשתמש מהטופס
        const userDetails = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            city: document.getElementById('city').value,
            street: document.getElementById('street').value,
            houseNumber: document.getElementById('house-number').value,
            notes: document.getElementById('notes').value,
            deliveryMethod: document.querySelector('input[name="delivery-method"]:checked').value,
            // הוספת מידע נוסף לסנכרון
            deviceType: window.isMobile ? 'mobile' : 'desktop',
            timestamp: new Date().getTime(),
            sessionId: window.sessionId || (window.sessionId = Math.random().toString(36).substring(2, 15)),
            syncVersion: (parseInt(localStorage.getItem('userDetailsSyncVersion') || '0') + 1).toString()
        };
        
        // שמירת הפרטים ב-localStorage
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
        
        // שמירת גרסת הסנכרון הנוכחית
        localStorage.setItem('userDetailsSyncVersion', userDetails.syncVersion);
        
        // שמירה גם ב-sessionStorage לסנכרון בין טאבים
        sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
        sessionStorage.setItem('userDetailsSyncVersion', userDetails.syncVersion);
        
        // שליחת אירוע מותאם לסנכרון בין חלונות באותו מכשיר
        try {
            const syncEvent = new CustomEvent('userDetailsSync', { 
                detail: { 
                    userDetails: userDetails,
                    syncVersion: userDetails.syncVersion
                } 
            });
            window.dispatchEvent(syncEvent);
            console.log('נשלח אירוע סנכרון פרטי משתמש גרסה:', userDetails.syncVersion);
        } catch (e) {
            console.log('שגיאה בשליחת אירוע סנכרון פרטי משתמש:', e);
        }
        
        // שמירת זמן הסנכרון האחרון
        localStorage.setItem('lastUserDetailsSyncTime', new Date().getTime().toString());
        
        console.log('פרטי המשתמש נשמרו וסונכרנו:', userDetails);
    }
}

// פונקציה למילוי שדות הטופס מפרטים מסונכרנים
function fillUserDetailsForm(userDetails) {
    if (!userDetails) return;
    
    console.log('ממלא פרטי משתמש מסונכרנים:', userDetails);
    
    // מילוי שדות הטקסט
    const fieldMappings = {
        'first-name': userDetails.firstName,
        'last-name': userDetails.lastName,
        'phone': userDetails.phone,
        'email': userDetails.email,
        'city': userDetails.city,
        'street': userDetails.street,
        'house-number': userDetails.houseNumber,
        'notes': userDetails.notes
    };
    
    // מילוי כל השדות הטקסטואליים
    for (const [fieldId, value] of Object.entries(fieldMappings)) {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
            
            // הוספת אפקט חזותי לשדות שהתמלאו
            field.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
            setTimeout(() => {
                field.style.backgroundColor = '';
                field.style.transition = 'background-color 0.5s ease';
            }, 1000);
        }
    }
    
    // בדיקה ומילוי שדה שיטת משלוח
    if (userDetails.deliveryMethod) {
        const deliveryMethodRadio = document.querySelector(`input[name="delivery-method"][value="${userDetails.deliveryMethod}"]`);
        if (deliveryMethodRadio) {
            deliveryMethodRadio.checked = true;
            
            // הוספת אפקט חזותי לסימון שיטת המשלוח
            const label = deliveryMethodRadio.parentElement;
            if (label) {
                label.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                setTimeout(() => {
                    label.style.backgroundColor = '';
                    label.style.transition = 'background-color 0.5s ease';
                }, 1000);
            }
        }
    }
    
    // הצגת הודעה למשתמש
    showMessage('הטופס מולא בהצלחה עם פרטים מסונכרנים', 'info');
}

// פונקציה להעתקת קישור ההפניה בשלב 3
function copyReferralLinkStep3() {
  const referralLinkInput = document.getElementById('referral-link-step3');
  if (referralLinkInput) {
    // בחירת הטקסט
    referralLinkInput.select();
    referralLinkInput.setSelectionRange(0, 99999); // למכשירים ניידים
    
    // העתקת הטקסט ללוח
    document.execCommand('copy');
    
    // הצגת הודעת הצלחה
    const copySuccess = document.getElementById('copy-success');
    if (copySuccess) {
      copySuccess.style.opacity = '1';
      setTimeout(() => {
        copySuccess.style.opacity = '0';
      }, 2000);
    } else {
      showMessage('הקישור הועתק בהצלחה!', 'success');
    }
  }
}

// פונקציה לעדכון קישור ההפניה בשלב 3
function updateReferralLinkStep3() {
  console.log('מעדכן קישור הפניה בשלב 3');
  
  // קבלת מזהה המשתמש מהשמירה הזמנית
  let userId = sessionStorage.getItem('userId');
  
  // אם אין מזהה משתמש, יצירת מזהה חדש
  if (!userId) {
    userId = generateUserId();
    sessionStorage.setItem('userId', userId);
    console.log('נוצר מזהה משתמש חדש:', userId);
  }
  
  // בדיקה אם יש כבר קוד הפניה
  let referralCode = sessionStorage.getItem('referralCode');
  
  // אם אין קוד הפניה, נסה למצוא בפרטי המשתמש
  if (!referralCode) {
    // נסה למצוא ב-localStorage
    const userKey = `userDetails_${userId}`;
    const savedUserDetails = localStorage.getItem(userKey) || localStorage.getItem('userDetails');
    
    if (savedUserDetails) {
      try {
        const userData = JSON.parse(savedUserDetails);
        referralCode = userData.referralCode;
        console.log('נמצא קוד הפניה בפרטי המשתמש:', referralCode);
      } catch (e) {
        console.error('שגיאה בקריאת פרטי המשתמש:', e);
      }
    }
  }
  
  // אם עדיין אין קוד הפניה, יצירת קוד חדש
  if (!referralCode) {
    referralCode = generateReferralCode(userId);
    console.log('נוצר קוד הפניה חדש:', referralCode);
    
    // שמירת הקוד בפרטי המשתמש
    const savedUserDetails = localStorage.getItem('userDetails');
    if (savedUserDetails) {
      try {
        const userData = JSON.parse(savedUserDetails);
        userData.referralCode = referralCode;
        localStorage.setItem('userDetails', JSON.stringify(userData));
        console.log('קוד ההפניה נשמר בפרטי המשתמש');
      } catch (e) {
        console.error('שגיאה בשמירת קוד ההפניה:', e);
      }
    }
  }
  
  // שמירת הקוד ב-sessionStorage
  sessionStorage.setItem('referralCode', referralCode);
  
  // עדכון הקישור
  updateShareLinksStep3(referralCode);
  
  // עדכון סטטיסטיקות ההפניות
  updateReferralStatsDisplay(userId);
  
  // וידוא שהקישור מוצג בשדה הטקסט
  setTimeout(() => {
    const referralLinkInput = document.getElementById('referral-link-step3');
    if (referralLinkInput && (!referralLinkInput.value || referralLinkInput.value === '')) {
      console.log('שדה הקישור ריק, מנסה לעדכן שוב');
      const referralLink = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;
      referralLinkInput.value = referralLink;
    }
  }, 500);
}

// פונקציה לעדכון קישורי השיתוף בשלב 3
function updateShareLinksStep3(referralCode) {
  const referralLink = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;
  
  // עדכון שדה הקישור
  const referralLinkInput = document.getElementById('referral-link-step3');
  if (referralLinkInput) {
    referralLinkInput.value = referralLink;
  }
  
  // עדכון כפתורי השיתוף
  const shareWhatsapp = document.getElementById('share-whatsapp-step3');
  const shareFacebook = document.getElementById('share-facebook-step3');
  const shareEmail = document.getElementById('share-email-step3');
  
  // וואטסאפ
  if (shareWhatsapp) {
    shareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent('הצטרף אליי לרכישה הקבוצתית של כורסת עיסוי במחיר מיוחד! ' + referralLink)}`;
  }
  
  // פייסבוק
  if (shareFacebook) {
    shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
  }
  
  // אימייל
  if (shareEmail) {
    shareEmail.href = `mailto:?subject=${encodeURIComponent('הזמנה לרכישה קבוצתית של כורסת עיסוי')}&body=${encodeURIComponent('הצטרף אליי לרכישה הקבוצתית של כורסת עיסוי במחיר מיוחד! ' + referralLink)}`;
  }
}

// פונקציה לעדכון תצוגת סטטיסטיקות ההפניות
function updateReferralStatsDisplay(userId) {
  if (!userId) {
    return;
  }
  
  // קריאת פרטי המשתמש מהשמירה
  const userKey = `userDetails_${userId}`;
  const userDetails = localStorage.getItem(userKey);
  
  if (userDetails) {
    const userData = JSON.parse(userDetails);
    const referredUsers = userData.referredUsers || [];
    const defaultDiscount = parseInt(localStorage.getItem('defaultReferralDiscount') || '150');
    const totalDiscount = referredUsers.length * defaultDiscount;
    
    // עדכון התצוגה
    const referredCountElement = document.getElementById('referred-count-step3');
    const totalDiscountElement = document.getElementById('total-discount-step3');
    
    if (referredCountElement) {
      referredCountElement.textContent = referredUsers.length;
    }
    
    if (totalDiscountElement) {
      totalDiscountElement.textContent = totalDiscount;
    }
  }
}

// פונקציה לטיפול בשליחת טופס פרטי המשתמש
function submitUserDetails() {
    console.log('בודק טופס פרטים...');
    
    // בדיקת תקינות הטופס
    const requiredFields = [
        'first-name',
        'last-name',
        'phone',
        'email',
        'city',
        'street',
        'house-number'
    ];
    
    let isValid = true;
    
    // בדיקת שדות חובה
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    // בדיקת תקינות דוא"ל
    const emailField = document.getElementById('email');
    if (emailField && emailField.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.classList.add('error');
            isValid = false;
        }
    }
    
    // בדיקת תקינות טלפון
    const phoneField = document.getElementById('phone');
    if (phoneField && phoneField.value.trim()) {
        const phoneRegex = /^0[2-9]\d{7,8}$/;
        if (!phoneRegex.test(phoneField.value)) {
            phoneField.classList.add('error');
            isValid = false;
        }
    }
    
    if (!isValid) {
        showMessage('אנא מלא את כל השדות המסומנים ב-*', 'error');
        return;
    }
    
    // שמירת פרטי המשתמש עם מידע סנכרון
    const userDetails = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        city: document.getElementById('city').value,
        street: document.getElementById('street').value,
        houseNumber: document.getElementById('house-number').value,
        notes: document.getElementById('notes').value,
        deliveryMethod: document.querySelector('input[name="delivery-method"]:checked').value,
        // מידע נוסף לסנכרון
        deviceType: window.isMobile ? 'mobile' : 'desktop',
        timestamp: new Date().getTime(),
        sessionId: window.sessionId || (window.sessionId = Math.random().toString(36).substring(2, 15)),
        syncVersion: (parseInt(localStorage.getItem('userDetailsSyncVersion') || '0') + 1).toString()
    };
    
    // יצירת מזהה ייחודי לנרשם
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // יצירת קוד הפניה ייחודי למשתמש
    const userReferralCode = generateReferralCode(userId);
    userDetails.userId = userId;
    userDetails.registrationDate = new Date().toISOString();
    userDetails.paymentStatus = 'ממתין לתשלום';
    
    // הוספת מידע על הפניות
    userDetails.referralCode = userReferralCode;  // קוד ההפניה של המשתמש
    userDetails.referredUsers = [];  // רשימת משתמשים שהופנו על ידי המשתמש
    userDetails.totalDiscount = 0;  // סכום ההנחה המצטבר
    
    // בדיקה אם המשתמש הגיע דרך הפניה
    const referredBy = sessionStorage.getItem('referredBy');
    const referralCode = sessionStorage.getItem('referralCode');
    
    if (referredBy) {
        userDetails.referredBy = referredBy;  // מי הפנה את המשתמש
    }
    
    if (referralCode) {
        userDetails.referralCodeUsed = referralCode;  // קוד ההפניה שהמשתמש השתמש בו
    }
    
    // שמירת הפרטים ב-localStorage עם מזהה ייחודי
    localStorage.setItem(`userDetails_${userId}`, JSON.stringify(userDetails));
    
    // שמירה גם במשתנה הרגיל לאחורה תאימות
    localStorage.setItem('userDetails', JSON.stringify(userDetails));
    localStorage.setItem('userDetailsSyncVersion', userDetails.syncVersion);
    sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
    sessionStorage.setItem('userDetailsSyncVersion', userDetails.syncVersion);
    localStorage.setItem('lastUserDetailsSyncTime', new Date().getTime().toString());
    
    // שמירת רשימת המשתמשים
    let usersList = JSON.parse(localStorage.getItem('usersList') || '[]');
    usersList.push(userId);
    localStorage.setItem('usersList', JSON.stringify(usersList));
    
    console.log('פרטי משתמש נשמרו ומוכנים לסנכרון:', userDetails);
    
    // עדכון סטטוס ההפניות של המשתמש המפנה
    if (referredBy) {
        updateReferralStats(referredBy, userId);
    }
    
    // הוספת משתתף חדש
    totalParticipants++;
    
    // הגבלה למקסימום 500 משתתפים
    totalParticipants = Math.min(totalParticipants, 500);
    
    // שמירת מספר המשתתפים המעודכן ב-localStorage
    localStorage.setItem('totalParticipants', totalParticipants.toString());
    console.log('מספר המשתתפים המעודכן אחרי רישום:', totalParticipants);
    
    // עדכון מספר המשתתפים והמחירים
    updateParticipantsDisplay();
    
    // שליחת אירועים מותאמים לסנכרון בין חלונות ומכשירים
    try {
        // 1. סנכרון מספר המשתתפים
        const participantSyncEvent = new CustomEvent('participantSync', { 
            detail: { 
                participants: totalParticipants
            } 
        });
        window.dispatchEvent(participantSyncEvent);
        console.log('נשלח אירוע סנכרון משתתפים:', totalParticipants);
        
        // 2. סנכרון פרטי המשתמש
        const userDetailsSyncEvent = new CustomEvent('userDetailsSync', { 
            detail: { 
                userDetails: userDetails,
                syncVersion: userDetails.syncVersion
            } 
        });
        window.dispatchEvent(userDetailsSyncEvent);
        console.log('נשלח אירוע סנכרון פרטי משתמש גרסה:', userDetails.syncVersion);
    } catch (e) {
        console.log('שגיאה בשליחת אירועי סנכרון:', e);
    }
    
    // שליחת הפרטים לוואטסאפ של הלקוח
    sendToCustomerWhatsApp(userDetails);
    
    // שליחת הפרטים לוואטסאפ של המנהל
    sendToManagerWhatsApp(userDetails);
    
    // שליחת הפרטים למייל של הלקוח
    sendToCustomerEmail(userDetails);
    
    // שליחת הפרטים למייל של המנהל
    sendToManagerEmail(userDetails);
    
    // הצגת הודעת הצלחה
    showMessage('הפרטים נשמרו בהצלחה ונשלחו!');
    
    // מעבר לשלב הבא - שימוש בפונקציה ישירות במקום setTimeout
    console.log('מעבר לשלב הסיכום');
    setTimeout(function() {
        showStep(3);
    }, 1000);
}

// פונקציה להוספת מאזינים לכפתורים
function setupEventListeners() {
    // מאזין לכפתור סגירת המודאל
    const closeModalButton = document.getElementById('close-modal');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            document.getElementById('info-modal').classList.remove('active');
        });
    }
    
    // סגירת המודאל בלחיצה מחוץ לתוכן
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('info-modal');
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// פונקציה לאתחול טופס כרטיס אשראי
function setupCreditCardForm() {
    // הוספת מאזינים לשדות הטופס
    const cardNumberInput = document.getElementById('card-number');
    const expiryDateInput = document.getElementById('expiry-date');
    const cvvInput = document.getElementById('cvv');
    const idNumberInput = document.getElementById('id-number');
    
    // פורמט מספר כרטיס אשראי (xxxx-xxxx-xxxx-xxxx)
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 16) value = value.substr(0, 16);
            
            // הוספת מקפים אחרי כל 4 ספרות
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += '-';
                }
                formattedValue += value[i];
            }
            
            e.target.value = formattedValue;
        });
    }
    
    // פורמט תאריך תוקף (MM/YY)
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 4) value = value.substr(0, 4);
            
            // הוספת קו נטוי אחרי חודש
            if (value.length > 2) {
                value = value.substr(0, 2) + '/' + value.substr(2);
            }
            
            e.target.value = value;
        });
    }
    
    // הגבלת קלט רק למספרים עבור CVV
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substr(0, 3);
        });
    }
    
    // הגבלת קלט רק למספרים עבור תעודת זהות
    if (idNumberInput) {
        idNumberInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substr(0, 9);
        });
    }
    
    // מילוי שם בעל הכרטיס מפרטי המשתמש אם קיימים
    const cardHolderInput = document.getElementById('card-holder');
    if (cardHolderInput) {
        const savedUserDetails = localStorage.getItem('userDetails');
        if (savedUserDetails) {
            const userDetails = JSON.parse(savedUserDetails);
            if (userDetails.firstName && userDetails.lastName) {
                cardHolderInput.value = `${userDetails.firstName} ${userDetails.lastName}`;
            }
        }
    }
}

// פונקציה לבדיקת תקינות פרטי כרטיס אשראי
function validateCreditCard() {
    const cardNumber = document.getElementById('card-number').value.replace(/-/g, '');
    const cardHolder = document.getElementById('card-holder').value.trim();
    const expiryDate = document.getElementById('expiry-date').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    const idNumber = document.getElementById('id-number').value.trim();
    
    // בדיקות בסיסיות
    if (cardNumber.length !== 16) {
        showMessage('מספר כרטיס אשראי חייב להיות 16 ספרות', 'error');
        return false;
    }
    
    if (!cardHolder) {
        showMessage('יש להזין שם בעל הכרטיס', 'error');
        return false;
    }
    
    if (expiryDate.length !== 5 || !expiryDate.includes('/')) {
        showMessage('תאריך תוקף לא תקין', 'error');
        return false;
    }
    
    if (cvv.length !== 3) {
        showMessage('CVV חייב להיות 3 ספרות', 'error');
        return false;
    }
    
    if (idNumber.length !== 9) {
        showMessage('תעודת זהות חייבת להיות 9 ספרות', 'error');
        return false;
    }
    
    return true;
}

// פונקציה לעיבוד תשלום
function processPayment() {
    // בדיקת תקינות הפרטים
    if (!validateCreditCard()) {
        return;
    }
    
    // הצגת הודעת טעינה
    showMessage('מעבד תשלום...', 'info');
    
    // סימולציה של עיבוד תשלום
    setTimeout(() => {
        // שמירת פרטי התשלום ב-localStorage
        const paymentDetails = {
            cardNumber: document.getElementById('card-number').value.replace(/-/g, '').replace(/\d(?=\d{4})/g, '*'),
            cardHolder: document.getElementById('card-holder').value,
            expiryDate: document.getElementById('expiry-date').value,
            payments: document.getElementById('payments').value,
            paymentDate: new Date().toISOString(),
            amount: finalPrice + (document.querySelector('input[name="delivery-method"]:checked').value === 'express' ? 100 : 50)
        };
        
        // שמירת פרטי התשלום באופן רגיל לאחורה תאימות
        localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));
        
        // עדכון פרטי המשתמש הנוכחי עם סטטוס תשלום
        const savedUserDetails = localStorage.getItem('userDetails');
        if (savedUserDetails) {
            try {
                const userDetails = JSON.parse(savedUserDetails);
                userDetails.paymentStatus = 'שולם';
                userDetails.paymentDetails = paymentDetails;
                userDetails.finalPrice = finalPrice;
                
                // שמירה במשתנה הרגיל
                localStorage.setItem('userDetails', JSON.stringify(userDetails));
                
                // שמירה גם במזהה הייחודי אם קיים
                if (userDetails.userId) {
                    localStorage.setItem(`userDetails_${userDetails.userId}`, JSON.stringify(userDetails));
                    localStorage.setItem(`paymentDetails_${userDetails.userId}`, JSON.stringify(paymentDetails));
                }
            } catch (e) {
                console.error('שגיאה בעדכון פרטי משתמש עם סטטוס תשלום:', e);
            }
        }
        
        // הצגת הודעת הצלחה
        showMessage('התשלום בוצע בהצלחה!', 'success');
        
        // מעבר לשלב האחרון לאחר השהייה קצרה
        setTimeout(() => {
            showStep(5);
            showCompletionScreen();
        }, 1000);
    }, 1500);
}

// פונקציה לבדיקת קוד הפניה בכתובת ה-URL
function checkReferralCode() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
            console.log('נמצא קוד הפניה:', refCode);
            // שמירת קוד ההפניה ב-sessionStorage
            sessionStorage.setItem('referralCode', refCode);
            referralCode = refCode;
            
            // בדיקה אם קוד ההפניה תקף
            validateReferralCode(refCode);
        } else {
            console.log('לא נמצא קוד הפניה בכתובת');
            // אם אין קוד הפניה, הצג את מסך "הצטרף רק עם הזמנה"
            const inviteOnlyMode = localStorage.getItem('inviteOnlyMode');
            
            // בדיקה אם המצב הוא invite-only
            if (inviteOnlyMode === 'true') {
                showInviteOnlyScreen();
            }
        }
    } catch (e) {
        console.error('שגיאה בבדיקת קוד הפניה:', e);
    }
}

// פונקציה לאימות קוד הפניה
function validateReferralCode(code) {
    // בדיקה אם קוד ההפניה קיים במערכת
    let isValid = false;
    
    // חיפוש בכל המשתמשים השמורים
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('userDetails_')) {
            try {
                const userDetails = JSON.parse(localStorage.getItem(key));
                if (userDetails.referralCode === code) {
                    isValid = true;
                    // שמירת מזהה המשתמש המפנה
                    sessionStorage.setItem('referredBy', userDetails.userId);
                    console.log('קוד הפניה תקף, המפנה:', userDetails.firstName, userDetails.lastName);
                    break;
                }
            } catch (e) {
                console.error('שגיאה בקריאת פרטי משתמש:', e);
            }
        }
    }
    
    // אם קוד ההפניה לא תקף והמצב הוא invite-only
    if (!isValid && localStorage.getItem('inviteOnlyMode') === 'true') {
        showInviteOnlyScreen();
        showMessage('קוד ההפניה אינו תקף', 'error');
    }
    
    return isValid;
}

// פונקציה להצגת מסך "הצטרף רק עם הזמנה"
function showInviteOnlyScreen() {
    document.getElementById('invite-only-screen').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
    
    // הוספת מאזין לטופס רשימת המתנה
    const waitlistForm = document.getElementById('waitlist-form');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // שמירת פרטי המשתמש ברשימת המתנה
            const waitlistName = document.getElementById('waitlist-name').value;
            const waitlistPhone = document.getElementById('waitlist-phone').value;
            
            // שמירה ב-localStorage
            const waitlistEntry = {
                name: waitlistName,
                phone: waitlistPhone,
                date: new Date().toISOString()
            };
            
            // הוספה לרשימת ההמתנה
            const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]');
            waitlist.push(waitlistEntry);
            localStorage.setItem('waitlist', JSON.stringify(waitlist));
            
            // הצגת הודעת אישור
            showMessage('תודה! נחזור אליך בהקדם', 'success');
            
            // איפוס הטופס
            waitlistForm.reset();
        });
    }
}

// פונקציה ליצירת קוד הפניה ייחודי
function generateReferralCode(userId) {
    // שילוב של אותיות ומספרים אקראיים
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // הוספת חלק מזהה המשתמש לקוד
    const userPart = userId.substring(userId.length - 3);
    return code + userPart;
}

// פונקציה להעתקת קישור ההפניה ללוח
function copyReferralLink() {
    const referralLink = document.getElementById('referral-link');
    referralLink.select();
    document.execCommand('copy');
    
    // הצגת הודעת הצלחה
    const copySuccess = document.getElementById('copy-success');
    copySuccess.style.opacity = '1';
    
    // הסתרת ההודעה לאחר 2 שניות
    setTimeout(() => {
        copySuccess.style.opacity = '0';
    }, 2000);
}

// פונקציה לעדכון לינקים לשיתוף
function updateShareLinks(referralCode) {
    const referralLink = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;
    
    // עדכון שדה הקישור
    document.getElementById('referral-link').value = referralLink;
    
    // עדכון כפתורי השיתוף
    const shareWhatsapp = document.getElementById('share-whatsapp');
    const shareFacebook = document.getElementById('share-facebook');
    const shareEmail = document.getElementById('share-email');
    
    // וואטסאפ
    shareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent('הצטרף אליי לרכישה הקבוצתית של כורסת עיסוי במחיר מיוחד! ' + referralLink)}`;
    
    // פייסבוק
    shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    
    // אימייל
    shareEmail.href = `mailto:?subject=${encodeURIComponent('הזמנה לרכישה קבוצתית של כורסת עיסוי')}&body=${encodeURIComponent('הצטרף אליי לרכישה הקבוצתית של כורסת עיסוי במחיר מיוחד! ' + referralLink)}`;
}

// פונקציה לעדכון סטטוס הפניות של משתמש
function updateReferralStats(referrerId, newUserId) {
    try {
        // קריאת פרטי המשתמש המפנה
        const referrerKey = `userDetails_${referrerId}`;
        const referrerData = localStorage.getItem(referrerKey);
        
        if (referrerData) {
            const referrer = JSON.parse(referrerData);
            
            // יצירת או עדכון רשימת המופנים
            if (!referrer.referredUsers) {
                referrer.referredUsers = [];
            }
            
            // הוספת המשתמש החדש לרשימה
            referrer.referredUsers.push(newUserId);
            
            // חישוב ההנחה המצטברת
            const defaultDiscount = parseInt(localStorage.getItem('defaultReferralDiscount') || '150');
            referrer.totalDiscount = (referrer.referredUsers.length * defaultDiscount) || 0;
            
            // שמירת הנתונים המעודכנים
            localStorage.setItem(referrerKey, JSON.stringify(referrer));
            console.log('עודכנו נתוני הפניות למשתמש:', referrerId);
        }
    } catch (e) {
        console.error('שגיאה בעדכון סטטוס הפניות:', e);
    }
}

// פונקציה ליצירת קוד הפניה ייחודי למשתמש
function generateReferralCode(userId) {
    // יצירת קוד אקראי באורך 6 תווים
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // שילוב עם חלק ממזהה המשתמש ליצירת קוד ייחודי
    const userPart = userId.substring(0, 3).toUpperCase();
    
    return `${userPart}-${randomPart}`;
}

// פונקציה לבדיקת קוד הפניה
function checkReferralCode() {
    console.log('בדיקת קוד הפניה');
    
    // בדיקה אם המצב הוא הזמנה בלבד
    const inviteOnlyMode = localStorage.getItem('inviteOnlyMode') === 'true';
    
    if (inviteOnlyMode) {
        // בדיקה אם יש קוד הפניה ב-URL
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
            console.log('נמצא קוד הפניה ב-URL:', refCode);
            // בדיקת תקינות הקוד
            if (validateReferralCode(refCode)) {
                console.log('קוד הפניה תקין:', refCode);
                sessionStorage.setItem('referralCode', refCode);
            } else {
                console.log('קוד הפניה לא תקין:', refCode);
                showInviteOnlyScreen();
            }
        } else {
            // אם אין קוד הפניה ב-URL, בדיקה אם יש בשמירה זמנית
            const savedCode = sessionStorage.getItem('referralCode');
            if (!savedCode) {
                console.log('לא נמצא קוד הפניה');
                showInviteOnlyScreen();
            }
        }
    }
}

// פונקציה לבדיקת תקינות קוד הפניה
function validateReferralCode(code) {
    // בדיקה אם יש קוד הפניה כזה במערכת
    const referralData = localStorage.getItem(`referral_${code}`);
    
    if (referralData) {
        try {
            const referral = JSON.parse(referralData);
            // בדיקה אם הקוד פעיל
            if (referral.active === true) {
                sessionStorage.setItem('referredBy', referral.name || 'משווק');
                return true;
            }
            return false;
        } catch (e) {
            console.error('שגיאה בקריאת נתוני הפניה:', e);
            return false;
        }
    }
    
    // בדיקה אם יש משתמש עם קוד הפניה כזה
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('userDetails_')) {
            try {
                const userData = JSON.parse(localStorage.getItem(key));
                if (userData.referralCode === code) {
                    // שמירת המשתמש המפנה
                    sessionStorage.setItem('referredBy', userData.userId);
                    return true;
                }
            } catch (e) {
                console.error('שגיאה בקריאת נתוני משתמש:', e);
            }
        }
    }
    
    return false;
}

// פונקציה להצגת מסך הזמנה בלבד
function showInviteOnlyScreen() {
    // הסתרת כל השלבים
    const allSteps = document.querySelectorAll('.step');
    allSteps.forEach(step => step.style.display = 'none');
    
    // הצגת מסך הזמנה בלבד
    const inviteScreen = document.getElementById('invite-only-screen');
    if (inviteScreen) {
        inviteScreen.style.display = 'flex';
    } else {
        console.error('לא נמצא אלמנט עם ID: invite-only-screen');
    }
}

// פונקציה לעדכון קישור ההפניה במסך הסיום
function updateReferralLink(userData) {
  if (!userData) {
    // אם אין נתוני משתמש, נסה לקבל אותם מהשמירה
    const userId = sessionStorage.getItem('userId');
    if (userId) {
      const userKey = `userDetails_${userId}`;
      const userDetails = localStorage.getItem(userKey);
      if (userDetails) {
        userData = JSON.parse(userDetails);
      }
    }
    
    if (!userData) {
      console.error('לא נמצאו פרטי משתמש לעדכון קישור ההפניה');
      return;
    }
  }
  
  // בדיקה אם יש קוד הפניה בנתוני המשתמש
  if (userData.referralCode) {
    // יצירת הקישור המלא עם קוד ההפניה
    const baseUrl = window.location.origin + window.location.pathname;
    const referralLink = `${baseUrl}?ref=${userData.referralCode}`;
    
    // עדכון שדה הקישור
    const referralLinkInput = document.getElementById('referral-link');
    if (referralLinkInput) {
      referralLinkInput.value = referralLink;
    }
    
    // עדכון כפתורי השיתוף
    const shareWhatsapp = document.getElementById('share-whatsapp');
    const shareFacebook = document.getElementById('share-facebook');
    const shareEmail = document.getElementById('share-email');
    
    // וואטסאפ
    if (shareWhatsapp) {
      shareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent('הצטרף אליי לרכישה הקבוצתית של כורסת עיסוי במחיר מיוחד! ' + referralLink)}`;
    }
    
    // פייסבוק
    if (shareFacebook) {
      shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    }
    
    // אימייל
    if (shareEmail) {
      shareEmail.href = `mailto:?subject=${encodeURIComponent('הזמנה לרכישה קבוצתית של כורסת עיסוי')}&body=${encodeURIComponent('הצטרף אליי לרכישה הקבוצתית של כורסת עיסוי במחיר מיוחד! ' + referralLink)}`;
    }
    
    console.log('קישור ההפניה עודכן:', referralLink);
  }
}

// פונקציה להעתקת קישור ההפניה
function copyReferralLink() {
  const referralLinkInput = document.getElementById('referral-link');
  if (referralLinkInput) {
    // בחירת הטקסט
    referralLinkInput.select();
    referralLinkInput.setSelectionRange(0, 99999); // למכשירים ניידים
    
    // העתקת הטקסט ללוח
    document.execCommand('copy');
    
    // הצגת הודעת הצלחה
    const copySuccess = document.getElementById('copy-success');
    if (copySuccess) {
      copySuccess.style.opacity = '1';
      setTimeout(() => {
        copySuccess.style.opacity = '0';
      }, 2000);
    } else {
      showMessage('הקישור הועתק בהצלחה!', 'success');
    }
  }
}

// פונקציה לפתיחת שיחת וואטסאפ עם שירות לקוחות
function openWhatsAppSupport() {
    try {
        // מספר הוואטסאפ של שירות הלקוחות בפורמט בינלאומי
        const supportPhone = '972587009938'; // מספר הוואטסאפ של שירות הלקוחות
        
        // הכנת הודעה מפורמטת
        let message = `שלום, אשמח לקבל מידע נוסף על הרכישה הקבוצתית של כורסת העיסוי.`;
        
        // הוספת פרטי משתמש אם קיימים
        const savedUserDetails = localStorage.getItem('userDetails');
        if (savedUserDetails) {
            const userDetails = JSON.parse(savedUserDetails);
            message += `\n\nפרטי המתעניין:\n`;
            if (userDetails.firstName) message += `שם: ${userDetails.firstName} ${userDetails.lastName || ''}\n`;
            if (userDetails.phone) message += `טלפון: ${userDetails.phone}\n`;
            if (userDetails.email) message += `אימייל: ${userDetails.email}\n`;
        }
        
        // הכנת URL לוואטסאפ
        const whatsappURL = `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`;
        
        // פתיחת חלון חדש עם הקישור לוואטסאפ
        window.open(whatsappURL, '_blank');
        console.log('נפתחה שיחת וואטסאפ עם שירות לקוחות');
        
        // הצגת הודעה למשתמש
        showMessage('מעביר אותך לשירות לקוחות בוואטסאפ...', 'info');
    } catch (e) {
        console.error('שגיאה בפתיחת שיחת וואטסאפ:', e);
        showMessage('אירעה שגיאה בפתיחת שיחת וואטסאפ', 'error');
    }
}
