// ===== APP STATE =====
let appState = {
  currentUser: null,
  books: [],
  reviews: [],
  ratings: [],
  users: [],
  favorites: [],
  nextBookId: 51,
  nextReviewId: 52,
  nextUserId: 4
};

// ===== INIT =====
function initApp() {
  const DATA_VERSION = 6;
  const saved = localStorage.getItem('kitobxonApp');
  const savedVersion = parseInt(localStorage.getItem('kitobxonDataVersion') || '0');

  try {
    if (saved && savedVersion === DATA_VERSION) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.users) {
        appState = parsed;
        if (!appState.users) appState.users = [];
        for (var di = 0; di < USERS.length; di++) {
          var found = false;
          for (var ui = 0; ui < appState.users.length; ui++) {
            if (appState.users[ui] && appState.users[ui].email === USERS[di].email) { found = true; break; }
          }
          if (!found) appState.users.push(USERS[di]);
        }
        if (!appState.books || appState.books.length === 0) {
          appState.books = [...BOOKS];
          appState.nextBookId = BOOKS.length + 1;
        }
        if (!appState.reviews) appState.reviews = [...REVIEWS];
        if (!appState.ratings) appState.ratings = [...RATINGS];
        if (!appState.favorites) appState.favorites = [];
        if (!appState.nextUserId) appState.nextUserId = appState.users.length + 1;
        if (!appState.nextReviewId) appState.nextReviewId = 1;
        localStorage.setItem('kitobxonApp', JSON.stringify(appState));
      } else {
        throw new Error('Invalid data');
      }
    } else {
      throw new Error('Version mismatch or no data');
    }
  } catch (e) {
    appState.books = [...BOOKS];
    appState.reviews = [...REVIEWS];
    appState.ratings = [...RATINGS];
    appState.users = [...USERS];
    appState.favorites = [];
    appState.nextBookId = BOOKS.length + 1;
    appState.nextReviewId = 1;
    appState.nextUserId = USERS.length + 1;
    localStorage.setItem('kitobxonApp', JSON.stringify(appState));
    localStorage.setItem('kitobxonDataVersion', DATA_VERSION);
  }

  try {
    const session = localStorage.getItem('kitobxonUser');
    if (session) {
      const user = JSON.parse(session);
      if (user && user.id) {
        var userExists = false;
        for (var i = 0; i < appState.users.length; i++) {
          if (appState.users[i] && appState.users[i].email === user.email) {
            userExists = true;
            if (user.role) appState.users[i].role = user.role;
            if (user.fullname) appState.users[i].fullname = user.fullname;
            if (user.avatar !== undefined) appState.users[i].avatar = user.avatar;
            appState.currentUser = appState.users[i];
            break;
          }
        }
        if (!userExists) {
          appState.users.push(user);
          appState.currentUser = user;
        }
        if (!appState.nextUserId) appState.nextUserId = appState.users.length + 1;
        localStorage.setItem('kitobxonApp', JSON.stringify(appState));
      }
    }
  } catch (e) {}

  updateNavbar();
  applyDarkMode();
  if (typeof applyTranslations === 'function') applyTranslations();
}

let _saveTimeout = null;
function saveState() {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem('kitobxonApp', JSON.stringify(appState));
      localStorage.setItem('kitobxonDataVersion', '6');
    } catch (e) {
      console.error('localStorage saqlashda xatolik:', e);
      showToast("Xotira to'ldi! Ba'zi ma'lumotlar saqlanmadi.", 'error');
    }
  }, 100);
}

function forceSave() {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  try {
    localStorage.setItem('kitobxonApp', JSON.stringify(appState));
    localStorage.setItem('kitobxonDataVersion', '6');
  } catch (e) {
    console.error('localStorage saqlashda xatolik:', e);
  }
}

// ===== AUTH =====
function login(email, password) {
  const user = appState.users.find(u => u.email === email && u.password === password);
  if (user) {
    appState.currentUser = user;
    localStorage.setItem('kitobxonUser', JSON.stringify(user));
    return { success: true, user };
  }
  return { success: false, message: "Email yoki parol noto'g'ri" };
}

function register(fullname, username, email, password) {
  if (appState.users.find(u => u.email === email)) {
    return { success: false, message: "Bu email allaqachon ro'yxatdan o'tgan" };
  }
  if (appState.users.find(u => u.username === username)) {
    return { success: false, message: "Bu username allaqachon band" };
  }
  const newUser = {
    id: appState.nextUserId++,
    fullname,
    username,
    email,
    password,
    role: 'user',
    avatar: null
  };
  appState.users.push(newUser);
  appState.currentUser = newUser;
  localStorage.setItem('kitobxonUser', JSON.stringify(newUser));
  forceSave();
  return { success: true, user: newUser };
}

function logout() {
  appState.currentUser = null;
  localStorage.removeItem('kitobxonUser');
  window.location.href = 'index.html';
}

// ===== NAVBAR =====
function updateNavbar() {
  const authNav = document.getElementById('authNav');
  const userNav = document.getElementById('userNav');
  if (!authNav || !userNav) return;

  if (appState.currentUser) {
    authNav.style.display = 'none';
    userNav.style.display = 'flex';
    const nameEl = document.getElementById('userDisplayName');
    const avatarEl = document.getElementById('userAvatarNav');
    const adminLink = document.getElementById('adminLink');
    const addBookLink = document.getElementById('addBookLink');
    if (nameEl) nameEl.textContent = appState.currentUser.fullname;
    if (avatarEl) avatarEl.textContent = appState.currentUser.fullname.charAt(0).toUpperCase();
    if (adminLink) adminLink.style.display = appState.currentUser.role === 'admin' ? 'block' : 'none';
    if (addBookLink) addBookLink.style.display = 'block';
  } else {
    authNav.style.display = 'flex';
    userNav.style.display = 'none';
  }
}

// ===== BOOK HELPERS =====
function getAuthor(id) {
  return AUTHORS.find(a => a.id === id) || { fullname: "Noma'lum", country: "" };
}

function getCategory(id) {
  return CATEGORIES.find(c => c.id === id) || { name: "Noma'lum", icon: "fa-book", color: "#999" };
}

function getBookRating(bookId) {
  const bookRatings = appState.ratings.filter(r => r.book_id === bookId);
  if (bookRatings.length === 0) return { avg: 0, count: 0 };
  const sum = bookRatings.reduce((a, b) => a + b.stars, 0);
  return { avg: (sum / bookRatings.length).toFixed(1), count: bookRatings.length };
}

function getBookReviews(bookId) {
  return appState.reviews.filter(r => r.book_id === bookId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getApprovedBooks() {
  return appState.books.filter(b => b.status === 'approved');
}

function getStarsHTML(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
  for (let i = 0; i < half; i++) html += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < empty; i++) html += '<i class="far fa-star"></i>';
  return html;
}

// ===== BOOK CARD HTML =====
function renderBookCard(book) {
  const author = getAuthor(book.author_id);
  const rating = getBookRating(book.id);
  const isFav = appState.currentUser && appState.favorites.some(f => f.user_id === appState.currentUser.id && f.book_id === book.id);

  return `
    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
      <div class="book-card">
        <div class="book-img">
          <a href="book-detail.html?id=${book.id}">
            <img src="${book.image}" alt="${book.title}" onerror="this.src='https://placehold.co/400x600/bdc3c7/2c3e50?text=Kitob'">
          </a>
          <span class="book-badge" style="background: ${getCategory(book.category_id).color};">${t('cat_' + book.category_id) || getCategory(book.category_id).name}</span>
          ${book.genre ? `<span class="book-genre-tag">${book.genre}</span>` : ''}
          ${appState.currentUser ? `<button class="book-fav ${isFav ? 'active' : ''}" onclick="toggleFavorite(${book.id}, event)"><i class="fa${isFav ? 's' : 'r'} fa-heart"></i></button>` : ''}
          <div class="book-overlay">
            <a href="book-detail.html?id=${book.id}" class="btn"><i class="fas fa-eye me-1"></i> ${t('see_detail')}</a>
          </div>
        </div>
        <div class="book-info">
          <a href="book-detail.html?id=${book.id}"><h6 class="book-title">${book.title}</h6></a>
          <p class="book-author"><i class="fas fa-user me-1"></i>${author.fullname}</p>
          ${rating.count > 0 ? `
          <div class="book-rating">
            <span class="stars">${getStarsHTML(parseFloat(rating.avg))}</span>
            <span class="rating-num">${rating.avg}</span>
            <span class="count">(${rating.count})</span>
          </div>` : ''}
        </div>
      </div>
    </div>`;
}

// ===== FAVORITES =====
function toggleFavorite(bookId, event) {
  event.preventDefault();
  event.stopPropagation();
  if (!appState.currentUser) {
    showToast('Avval tizimga kiring', 'error');
    return;
  }
  const idx = appState.favorites.findIndex(f => f.user_id === appState.currentUser.id && f.book_id === bookId);
  if (idx > -1) {
    appState.favorites.splice(idx, 1);
    showToast("Sevimlilardan o'chirildi", 'info');
  } else {
    appState.favorites.push({ user_id: appState.currentUser.id, book_id: bookId });
    showToast("Sevimlilarga qo'shildi", 'success');
  }
  forceSave();
}

// ===== REVIEWS =====
function addReview(bookId, comment, stars) {
  if (!appState.currentUser) {
    showToast('Avval tizimga kiring', 'error');
    return false;
  }
  const existingRating = appState.ratings.find(r => r.user_id === appState.currentUser.id && r.book_id === bookId);
  if (existingRating) {
    existingRating.stars = stars;
  } else {
    appState.ratings.push({ user_id: appState.currentUser.id, book_id: bookId, stars });
  }

  const existingReview = appState.reviews.find(r => r.user_id === appState.currentUser.id && r.book_id === bookId);
  if (existingReview) {
    existingReview.comment = comment;
    existingReview.stars = stars;
    existingReview.created_at = new Date().toISOString().split('T')[0];
    showToast('Sharh yangilandi', 'success');
  } else {
    appState.reviews.push({
      id: appState.nextReviewId++,
      user_id: appState.currentUser.id,
      book_id: bookId,
      comment,
      stars,
      created_at: new Date().toISOString().split('T')[0]
    });
    showToast('Sharh qo\'shildi!', 'success');
  }
  forceSave();
  return true;
}

function deleteReview(reviewId) {
  const idx = appState.reviews.findIndex(r => r.id === reviewId);
  if (idx > -1) {
    const review = appState.reviews[idx];
    appState.reviews.splice(idx, 1);
    const rIdx = appState.ratings.findIndex(r => r.user_id === review.user_id && r.book_id === review.book_id);
    if (rIdx > -1) appState.ratings.splice(rIdx, 1);
    forceSave();
    showToast("Sharh o'chirildi", 'info');
  }
}

// ===== BOOKS CRUD =====
function addBook(bookData) {
  const newBook = {
    id: appState.nextBookId++,
    ...bookData,
    created_by: appState.currentUser.username,
    status: appState.currentUser.role === 'admin' ? 'approved' : 'pending',
    created_at: new Date().toISOString().split('T')[0]
  };
  appState.books.push(newBook);
  forceSave();
  return newBook;
}

function deleteBook(bookId) {
  appState.books = appState.books.filter(b => b.id !== bookId);
  appState.reviews = appState.reviews.filter(r => r.book_id !== bookId);
  appState.ratings = appState.ratings.filter(r => r.book_id !== bookId);
  forceSave();
  showToast("Kitob o'chirildi", 'info');
}

function approveBook(bookId) {
  const book = appState.books.find(b => b.id === bookId);
  if (book) {
    book.status = 'approved';
    forceSave();
    showToast('Kitob tasdiqlandi', 'success');
  }
}

// ===== USER MANAGEMENT =====
function deleteUser(userId) {
  appState.users = appState.users.filter(u => u.id !== userId);
  appState.reviews = appState.reviews.filter(r => r.user_id !== userId);
  appState.ratings = appState.ratings.filter(r => r.user_id !== userId);
  forceSave();
  showToast("Foydalanuvchi o'chirildi", 'info');
}

// ===== SEARCH & FILTER =====
function searchBooks(query, categoryId, sortBy) {
  let books = getApprovedBooks();

  if (query) {
    const q = query.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      getAuthor(b.author_id).fullname.toLowerCase().includes(q) ||
      (b.genre && b.genre.toLowerCase().includes(q))
    );
  }

  if (categoryId) {
    books = books.filter(b => b.category_id === parseInt(categoryId));
  }

  switch (sortBy) {
    case 'rating':
      books.sort((a, b) => parseFloat(getBookRating(b.id).avg) - parseFloat(getBookRating(a.id).avg));
      break;
    case 'reviews':
      books.sort((a, b) => getBookReviews(b.id).length - getBookReviews(a.id).length);
      break;
    case 'newest':
      books.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'az':
      books.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      books.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return books;
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db' };

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.2rem;"></i>
    <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== DARK MODE =====
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('kitobxonDarkMode', document.body.classList.contains('dark-mode'));
  const btn = document.getElementById('darkModeBtn');
  if (btn) {
    btn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light' : '🌙 Dark';
  }
}

function resetData() {
  window.location.reload();
}

function applyDarkMode() {
  if (localStorage.getItem('kitobxonDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('darkModeBtn');
    if (btn) btn.textContent = '☀️ Light';
  }
}

// ===== LANGUAGE SWITCHER =====
let currentLang = localStorage.getItem('kitobxonLang') || 'uz';

const translations = {
  uz: {
    hero_title: "Kitoblar haqida <span>fikrlaringizni</span> ulashing",
    hero_desc: "O'qigan kitoblaringiz haqida fikr-mulohazalaringizni bildiring, boshqa kitobxonlarga tavsiyalar bering va eng yaxshi kitoblarni kashf eting.",
    hero_btn: "Kitoblarni ko'rish",
    stat_books: "Kitoblar",
    stat_users: "Kitobxonlar",
    stat_reviews: "Sharhlar",
    nav_home: "Bosh sahifa",
    nav_books: "Kitoblar",
    nav_categories: "Kategoriyalar",
    nav_login: "Kirish",
    nav_register: "Ro'yxatdan o'tish",
    nav_add_book: "Kitob qo'shish",
    nav_admin: "Admin",
    nav_profile: "Profil",
    nav_logout: "Chiqish",
    section_popular: "Eng <span>mashhur</span> kitoblar",
    section_popular_sub: "Kitobxonlar tomonidan eng ko'p baholangan kitoblar",
    section_top_rated: "Eng yuqori <span>baholangan</span>",
    section_top_rated_sub: "Eng ko'p yulduz olgan kitoblar",
    section_categories: "Kategoriyalar <span>bo'yicha</span>",
    section_categories_sub: "Qiziqishingizga mos kitoblarni toping",
    section_reviews: "So'nggi <span>sharhlar</span>",
    section_reviews_sub: "Kitobxonlarning eng yangi fikrlari",
    search_placeholder: "Kitob nomi, muallif yoki janr qidirish...",
    search_placeholder_books: "Kitob nomi, muallif yoki janr...",
    search_btn: "Qidirish",
    view_all: "Barchasini ko'rish",
    see_detail: "Batafsil",
    footer_desc: "Kitobxonlarning badiiy va ilmiy-ommabop adabiyotlar bo'yicha xulosalarini yig'ish axborot tizimi.",
    footer_pages: "Sahifalar",
    footer_users: "Foydalanuvchi",
    footer_contact: "Bog'lanish",
    copyright: "Barcha huquqlar himoyalangan. Diplom loyihasi.",
    all_categories: "Barcha kategoriyalar",
    sort_newest: "Eng yangi",
    sort_rating: "Eng yuqori reyting",
    sort_reviews: "Eng ko'p sharh",
    sort_az: "Alifbo bo'yicha",
    books_title: "Barcha <span>kitoblar</span>",
    categories_title: "Kategoriyalar <span>bo'yicha</span>",
    categories_subtitle: "Qiziqishingizga mos kitoblarni toping",
    download_pdf: "Yuklab olish (PDF)",
    read_ziyonet: "ZiyoNET da o'qish",
    add_fav: "Sevimlilarga qo'shish",
    remove_fav: "Sevimlilardan o'chirish",
    about_book: "Kitob haqida",
    author: "Muallif",
    category: "Kategoriya",
    published_year: "Nashr yili",
    language: "Til",
    pages: "Sahifalar",
    isbn: "ISBN",
    reviews_section: "Sharhlar",
    write_review: "Sharh yozish",
    no_reviews: "Hali sharh yo'q. Birinchi bo'lib sharh yozing!",
    rating: "Baho",
    send: "Yuborish",
    add_book_title: "Yangi kitob qo'shish",
    add_book_desc: "Majburiy maydonlarni to'ldiring, qolganlarni o'tkazib yuborishingiz mumkin.",
    basic_info: "Asosiy ma'lumotlar",
    book_name: "Kitob nomi",
    book_image: "Rasm URL",
    book_image_file: "Rasm fayl yuklash (ixtiyoriy)",
    book_image_hint: "Bo'sh qoldirsangiz avtomatik",
    description: "Tavsif (Annotatsiya)",
    author_kat: "Muallif va kategoriya",
    select_author: "Tanlang...",
    new_author: "Yangi muallif (tanlamasangiz)",
    country: "Mamlakat",
    select_category: "Tanlang...",
    genre: "Janr",
    genre_placeholder: "Masalan: Roman, Ilmiy, Qo'llanma",
    extra_info: "Qo'shimcha ma'lumotlar (hammasi ixtiyoriy)",
    publish_year: "Nashr yili",
    pages_count: "Sahifalar soni",
    publisher: "Nashriyot",
    files_links: "Fayl va havolalar (ixtiyoriy)",
    pdf_url: "PDF fayl URL",
    pdf_hint: "PDF fayl manzilini kiriting",
    source_url: "Manba URL (kitob sahifasi)",
    source_hint: "Kitob sahifasiga havola",
    save_book: "Kitobni saqlash",
    skip: "O'tkazib yuborish",
    login_title: "Tizimga kirish",
    login_subtitle: "Hisobingizga kiring va kitoblarni baholang",
    email_label: "Email",
    password_label: "Parol",
    login_btn: "Kirish",
    no_account: "Hisobingiz yo'qmi?",
    register_link: "Ro'yxatdan o'ting",
    register_title: "Ro'yxatdan o'tish",
    register_subtitle: "Yangi hisob yarating va kitobxonlar jamoasiga qo'shiling",
    fullname_label: "To'liq ism",
    username_label: "Username",
    password_confirm: "Parolni tasdiqlang",
    register_btn: "Ro'yxatdan o'tish",
    has_account: "Hisobingiz bormi?",
    login_link: "Tizimga kiring",
    demo_account: "Demo hisob",
    profile_title: "Shaxsiy profil",
    my_reviews: "Mening sharhlarim",
    my_favorites: "Sevimli kitoblarim",
    admin_dashboard: "Dashboard",
    admin_books: "Kitoblar",
    admin_pending: "Kutayotgan kitoblar",
    admin_users: "Foydalanuvchilar",
    admin_reviews: "Sharhlar",
    admin_back: "Saytga qaytish",
    admin_logout: "Chiqish",
    admin_reset: "Ma'lumotlarni tiklash",
    admin_total_books: "Jami kitoblar",
    admin_total_users: "Foydalanuvchilar",
    admin_total_reviews: "Sharhlar",
    admin_pending_count: "Kutayotgan",
    top_books: "Eng mashhur kitoblar",
    recent_reviews: "So'nggi sharhlar",
    all_books: "Barcha kitoblar",
    pending_books: "Kutayotgan kitoblar",
    all_users: "Foydalanuvchilar",
    all_reviews: "Barcha sharhlar",
    approved: "Tasdiqlangan",
    pending: "Kutayotgan",
    actions: "Amallar",
    delete: "O'chirish",
    approve: "Tasdiqlash",
    no_pending: "Barcha kitoblar tasdiqlangan!",
    edit_book: "Kitobni tahrirlash",
    confirm_delete: "O'chirmoqchimisiz?",
    book_added: "Kitob muvaffaqiyatli qo'shildi!",
    book_approved: "Kitob muvaffaqiyatli qo'shildi va tasdiqlandi!",
    book_pending: "Kitob muvaffaqiyatli qo'shildi! Admin tasdiqlashini kuting.",
    no_books: "Kitob topilmadi",
    no_books_hint: "Qidiruv so'zlaringizni o'zgartirib ko'ring",
    all_categories_opt: "Barcha kategoriyalar",
    top_rated_no: "Hali baholar yo'q",
    footer_right: "Barcha huquqlar himoyalangan.",
    review_added: "Sharh qo'shildi!",
    review_updated: "Sharh yangilandi",
    review_deleted: "Sharh o'chirildi",
    book_deleted: "Kitob o'chirildi",
    book_approved_toast: "Kitob tasdiqlandi",
    login_error: "Email yoki parol noto'g'ri",
    register_error_email: "Bu email allaqachon ro'yxatdan o'tgan",
    register_error_user: "Bu username allaqachon band",
    all_fields: "Barcha maydonlarni to'ldiring",
    password_short: "Parol kamida 6 ta belgi bo'lishi kerak",
    password_mismatch: "Parollar mos kelmadi",
    login_required: "Avval tizimga kiring",
    select_author_error: "Muallifni tanlang yoki yangi muallif kiriting!",
    fields_required: "Kitob nomi, tavsif va kategoriyani to'ldiring!",
    add_fav_toast: "Sevimlilarga qo'shildi",
    remove_fav_toast: "Sevimlilardan o'chirildi",
    reset_confirm: "Barcha ma'lumotlar asl holatiga qaytariladi. Davom etasizmi?",
    no_reviews_yet: "Hali sharh yo'q",
    be_first_review: "Birinchi bo'lib sharh yozing!",
    saved: "Saqlandi",
    cat_1: "Tibbiyot va farmasevtika",
    cat_2: "Iqtisod va boshqaruv",
    cat_3: "Falsafa",
    cat_4: "Filologiya",
    cat_5: "Texnika va texnologiyalar",
    cat_6: "Biologiya",
    cat_7: "Harbiy ta'lim",
    cat_8: "Pedagogika",
    cat_9: "Fizika",
    cat_10: "Yuridik fanlar",
    cat_11: "Matematika",
    cat_12: "Qishloq xo'jaligi",
    books_count: "ta kitob",
  },
  ru: {
    hero_title: "Делитесь <span>мнениями</span> о книгах",
    hero_desc: "Делитесь впечатлениями о прочитанных книгах, рекомендуйте другим читателям и находите лучшие произведения.",
    hero_btn: "Посмотреть книги",
    stat_books: "Книги",
    stat_users: "Читатели",
    stat_reviews: "Отзывы",
    nav_home: "Главная",
    nav_books: "Книги",
    nav_categories: "Категории",
    nav_login: "Войти",
    nav_register: "Регистрация",
    nav_add_book: "Добавить книгу",
    nav_admin: "Админ",
    nav_profile: "Профиль",
    nav_logout: "Выход",
    section_popular: "Самые <span>популярные</span> книги",
    section_popular_sub: "Наиболее оцениваемые книги читателями",
    section_top_rated: "Самые <span>высокооценённые</span>",
    section_top_rated_sub: "Книги с наивысшим рейтингом",
    section_categories: "По <span>категориям</span>",
    section_categories_sub: "Найдите книги по вашим интересам",
    section_reviews: "Последние <span>отзывы</span>",
    section_reviews_sub: "Свежие мнения читателей",
    search_placeholder: "Поиск по названию, автору или жанру...",
    search_placeholder_books: "Название, автор или жанр...",
    search_btn: "Поиск",
    view_all: "Посмотреть все",
    see_detail: "Подробнее",
    footer_desc: "Информационная система сбора отзывов читателей о художественной и научно-популярной литературе.",
    footer_pages: "Страницы",
    footer_users: "Пользователи",
    footer_contact: "Контакты",
    copyright: "Все права защищены. Дипломный проект.",
    all_categories: "Все категории",
    sort_newest: "Новейшие",
    sort_rating: "Высший рейтинг",
    sort_reviews: "Больше отзывов",
    sort_az: "По алфавиту",
    books_title: "Все <span>книги</span>",
    categories_title: "По <span>категориям</span>",
    categories_subtitle: "Найдите книги по вашим интересам",
    download_pdf: "Скачать (PDF)",
    read_ziyonet: "Читать на ZiyoNET",
    add_fav: "В избранное",
    remove_fav: "Убрать из избранного",
    about_book: "О книге",
    author: "Автор",
    category: "Категория",
    published_year: "Год издания",
    language: "Язык",
    pages: "Страницы",
    isbn: "ISBN",
    reviews_section: "Отзывы",
    write_review: "Написать отзыв",
    no_reviews: "Пока нет отзывов. Будьте первым!",
    rating: "Оценка",
    send: "Отправить",
    add_book_title: "Добавить новую книгу",
    add_book_desc: "Заполните обязательные поля, остальные можно пропустить.",
    basic_info: "Основная информация",
    book_name: "Название книги",
    book_image: "URL изображения",
    book_image_file: "Загрузить обложку (необязательно)",
    book_image_hint: "Если пусто — сгенерируется автоматически",
    description: "Описание (Аннотация)",
    author_kat: "Автор и категория",
    select_author: "Выберите...",
    new_author: "Новый автор (если не выбрали)",
    country: "Страна",
    select_category: "Выберите...",
    genre: "Жанр",
    genre_placeholder: "Например: Роман, Научная, Справочник",
    extra_info: "Дополнительная информация (все необязательно)",
    publish_year: "Год издания",
    pages_count: "Количество страниц",
    publisher: "Издательство",
    files_links: "Файлы и ссылки (необязательно)",
    pdf_url: "URL PDF файла",
    pdf_hint: "Введите адрес PDF файла",
    source_url: "URL источника (страница книги)",
    source_hint: "Ссылка на страницу книги",
    save_book: "Сохранить книгу",
    skip: "Пропустить",
    login_title: "Вход в систему",
    login_subtitle: "Войдите в аккаунт и оценивайте книги",
    email_label: "Email",
    password_label: "Пароль",
    login_btn: "Войти",
    no_account: "Нет аккаунта?",
    register_link: "Зарегистрируйтесь",
    register_title: "Регистрация",
    register_subtitle: "Создайте аккаунт и присоединяйтесь к сообществу читателей",
    fullname_label: "Полное имя",
    username_label: "Имя пользователя",
    password_confirm: "Подтвердите пароль",
    register_btn: "Зарегистрироваться",
    has_account: "Уже есть аккаунт?",
    login_link: "Войдите",
    demo_account: "Демо аккаунт",
    profile_title: "Личный профиль",
    my_reviews: "Мои отзывы",
    my_favorites: "Избранные книги",
    admin_dashboard: "Панель управления",
    admin_books: "Книги",
    admin_pending: "Ожидающие книги",
    admin_users: "Пользователи",
    admin_reviews: "Отзывы",
    admin_back: "На сайт",
    admin_logout: "Выход",
    admin_reset: "Сбросить данные",
    admin_total_books: "Всего книг",
    admin_total_users: "Пользователей",
    admin_total_reviews: "Отзывов",
    admin_pending_count: "Ожидающие",
    top_books: "Самые популярные книги",
    recent_reviews: "Последние отзывы",
    all_books: "Все книги",
    pending_books: "Ожидающие книги",
    all_users: "Пользователи",
    all_reviews: "Все отзывы",
    approved: "Одобрено",
    pending: "Ожидание",
    actions: "Действия",
    delete: "Удалить",
    approve: "Одобрить",
    no_pending: "Все книги одобрены!",
    edit_book: "Редактировать книгу",
    confirm_delete: "Вы уверены?",
    book_added: "Книга успешно добавлена!",
    book_approved: "Книга добавлена и одобрена!",
    book_pending: "Книга добавлена! Ожидайте одобрения админа.",
    no_books: "Книги не найдены",
    no_books_hint: "Измените поисковый запрос",
    all_categories_opt: "Все категории",
    top_rated_no: "Пока нет оценок",
    footer_right: "Все права защищены.",
    review_added: "Отзыв добавлен!",
    review_updated: "Отзыв обновлён",
    review_deleted: "Отзыв удалён",
    book_deleted: "Книга удалена",
    book_approved_toast: "Книга одобрена",
    login_error: "Неверный email или пароль",
    register_error_email: "Этот email уже зарегистрирован",
    register_error_user: "Это имя пользователя уже занято",
    all_fields: "Заполните все поля",
    password_short: "Пароль должен быть не менее 6 символов",
    password_mismatch: "Пароли не совпадают",
    login_required: "Сначала войдите в систему",
    select_author_error: "Выберите автора или введите нового!",
    fields_required: "Заполните название, описание и категорию!",
    add_fav_toast: "Добавлено в избранное",
    remove_fav_toast: "Удалено из избранного",
    reset_confirm: "Все данные будут сброшены. Продолжить?",
    no_reviews_yet: "Пока нет отзывов",
    be_first_review: "Будьте первым!",
    saved: "Сохранено",
    cat_1: "Медицина и фармацевтика",
    cat_2: "Экономика и управление",
    cat_3: "Философия",
    cat_4: "Филология",
    cat_5: "Техника и технологии",
    cat_6: "Биология",
    cat_7: "Военное образование",
    cat_8: "Педагогика",
    cat_9: "Физика",
    cat_10: "Юридические науки",
    cat_11: "Математика",
    cat_12: "Сельское хозяйство",
    books_count: "книг",
  },
  en: {
    hero_title: "Share your <span>opinions</span> about books",
    hero_desc: "Share your thoughts about books you've read, recommend to other readers and discover the best works.",
    hero_btn: "Browse Books",
    stat_books: "Books",
    stat_users: "Readers",
    stat_reviews: "Reviews",
    nav_home: "Home",
    nav_books: "Books",
    nav_categories: "Categories",
    nav_login: "Login",
    nav_register: "Register",
    nav_add_book: "Add Book",
    nav_admin: "Admin",
    nav_profile: "Profile",
    nav_logout: "Logout",
    section_popular: "Most <span>Popular</span> Books",
    section_popular_sub: "Highest rated books by readers",
    section_top_rated: "Top <span>Rated</span>",
    section_top_rated_sub: "Books with highest star ratings",
    section_categories: "By <span>Categories</span>",
    section_categories_sub: "Find books matching your interests",
    section_reviews: "Latest <span>Reviews</span>",
    section_reviews_sub: "Fresh opinions from readers",
    search_placeholder: "Search by title, author or genre...",
    search_placeholder_books: "Title, author or genre...",
    search_btn: "Search",
    view_all: "View All",
    see_detail: "Details",
    footer_desc: "Information system for collecting reader reviews of fiction and popular science literature.",
    footer_pages: "Pages",
    footer_users: "Users",
    footer_contact: "Contact",
    copyright: "All rights reserved. Diploma project.",
    all_categories: "All categories",
    sort_newest: "Newest",
    sort_rating: "Highest rating",
    sort_reviews: "Most reviews",
    sort_az: "A-Z",
    books_title: "All <span>Books</span>",
    categories_title: "By <span>Categories</span>",
    categories_subtitle: "Find books matching your interests",
    download_pdf: "Download (PDF)",
    read_ziyonet: "Read on ZiyoNET",
    add_fav: "Add to favorites",
    remove_fav: "Remove from favorites",
    about_book: "About the book",
    author: "Author",
    category: "Category",
    published_year: "Published",
    language: "Language",
    pages: "Pages",
    isbn: "ISBN",
    reviews_section: "Reviews",
    write_review: "Write a review",
    no_reviews: "No reviews yet. Be the first!",
    rating: "Rating",
    send: "Send",
    add_book_title: "Add a new book",
    add_book_desc: "Fill in required fields, others are optional.",
    basic_info: "Basic Information",
    book_name: "Book name",
    book_image: "Image URL",
    book_image_file: "Upload cover image (optional)",
    book_image_hint: "Leave empty for auto-generation",
    description: "Description (Summary)",
    author_kat: "Author & Category",
    select_author: "Select...",
    new_author: "New author (if not listed)",
    country: "Country",
    select_category: "Select...",
    genre: "Genre",
    genre_placeholder: "e.g. Novel, Scientific, Reference",
    extra_info: "Additional info (all optional)",
    publish_year: "Publish year",
    pages_count: "Number of pages",
    publisher: "Publisher",
    files_links: "Files & Links (optional)",
    pdf_url: "PDF file URL",
    pdf_hint: "Enter PDF file address",
    source_url: "Source URL (book page)",
    source_hint: "Link to the book page",
    save_book: "Save Book",
    skip: "Skip",
    login_title: "Sign In",
    login_subtitle: "Log in to your account and rate books",
    email_label: "Email",
    password_label: "Password",
    login_btn: "Login",
    no_account: "Don't have an account?",
    register_link: "Register",
    register_title: "Create Account",
    register_subtitle: "Create an account and join the reader community",
    fullname_label: "Full name",
    username_label: "Username",
    password_confirm: "Confirm password",
    register_btn: "Register",
    has_account: "Already have an account?",
    login_link: "Sign in",
    demo_account: "Demo account",
    profile_title: "Personal Profile",
    my_reviews: "My Reviews",
    my_favorites: "My Favorites",
    admin_dashboard: "Dashboard",
    admin_books: "Books",
    admin_pending: "Pending Books",
    admin_users: "Users",
    admin_reviews: "Reviews",
    admin_back: "Back to site",
    admin_logout: "Logout",
    admin_reset: "Reset Data",
    admin_total_books: "Total Books",
    admin_total_users: "Users",
    admin_total_reviews: "Reviews",
    admin_pending_count: "Pending",
    top_books: "Most Popular Books",
    recent_reviews: "Recent Reviews",
    all_books: "All Books",
    pending_books: "Pending Books",
    all_users: "Users",
    all_reviews: "All Reviews",
    approved: "Approved",
    pending: "Pending",
    actions: "Actions",
    delete: "Delete",
    approve: "Approve",
    no_pending: "All books approved!",
    edit_book: "Edit Book",
    confirm_delete: "Are you sure?",
    book_added: "Book added successfully!",
    book_approved: "Book added and approved!",
    book_pending: "Book added! Waiting for admin approval.",
    no_books: "No books found",
    no_books_hint: "Try different search terms",
    all_categories_opt: "All categories",
    top_rated_no: "No ratings yet",
    footer_right: "All rights reserved.",
    review_added: "Review added!",
    review_updated: "Review updated",
    review_deleted: "Review deleted",
    book_deleted: "Book deleted",
    book_approved_toast: "Book approved",
    login_error: "Invalid email or password",
    register_error_email: "This email is already registered",
    register_error_user: "This username is already taken",
    all_fields: "Fill in all fields",
    password_short: "Password must be at least 6 characters",
    password_mismatch: "Passwords don't match",
    login_required: "Please log in first",
    select_author_error: "Select an author or enter a new one!",
    fields_required: "Fill in book name, description and category!",
    add_fav_toast: "Added to favorites",
    remove_fav_toast: "Removed from favorites",
    reset_confirm: "All data will be reset. Continue?",
    no_reviews_yet: "No reviews yet",
    be_first_review: "Be the first!",
    saved: "Saved",
    cat_1: "Medicine & Pharmacy",
    cat_2: "Economics & Management",
    cat_3: "Philosophy",
    cat_4: "Philology",
    cat_5: "Engineering & Technology",
    cat_6: "Biology",
    cat_7: "Military Education",
    cat_8: "Pedagogy",
    cat_9: "Physics",
    cat_10: "Legal Sciences",
    cat_11: "Mathematics",
    cat_12: "Agriculture",
    books_count: "books",
  }
};

function switchLang(lang) {
  currentLang = lang;
  localStorage.setItem('kitobxonLang', lang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  applyTranslations();
  if (typeof renderCategories === 'function') renderCategories();
  if (typeof renderHomeCategories === 'function') renderHomeCategories();
  if (typeof renderBooksList === 'function') renderBooksList();
  if (typeof renderCategoryFilter === 'function') renderCategoryFilter();
  if (typeof performSearch === 'function') performSearch();
}

function t(key) {
  return translations[currentLang][key] || translations['uz'][key] || key;
}

function applyTranslations() {
  const trans = translations[currentLang];
  if (!trans) return;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
  });

  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (trans[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = trans[key];
      } else {
        el.innerHTML = trans[key];
      }
    }
  });

  document.querySelectorAll('[data-t-placeholder]').forEach(el => {
    const key = el.getAttribute('data-t-placeholder');
    if (trans[key]) el.placeholder = trans[key];
  });

  document.querySelectorAll('[data-t-title]').forEach(el => {
    const key = el.getAttribute('data-t-title');
    if (trans[key]) el.title = trans[key];
  });

  document.querySelectorAll('[data-t-confirm]').forEach(el => {
    const key = el.getAttribute('data-t-confirm');
    if (trans[key]) el.setAttribute('data-confirm-msg', trans[key]);
  });
}

// ===== UTILITY =====
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getInitials(name) {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
}

// ===== SELF-HEALING SYSTEM =====
var DIAGNOSTICS = {
  run: function() {
    var issues = [];
    var fixed = 0;

    // 1. State structure check
    if (!appState.books) { appState.books = []; issues.push('books missing → fixed'); fixed++; }
    if (!appState.reviews) { appState.reviews = []; issues.push('reviews missing → fixed'); fixed++; }
    if (!appState.ratings) { appState.ratings = []; issues.push('ratings missing → fixed'); fixed++; }
    if (!appState.users) { appState.users = []; issues.push('users missing → fixed'); fixed++; }
    if (!appState.favorites) { appState.favorites = []; issues.push('favorites missing → fixed'); fixed++; }
    if (!appState.nextBookId) appState.nextBookId = BOOKS.length + 1;
    if (!appState.nextReviewId) appState.nextReviewId = 1;
    if (!appState.nextUserId) appState.nextUserId = appState.users.length + 1;

    // 2. Default users check
    for (var di = 0; di < USERS.length; di++) {
      var found = false;
      for (var ui = 0; ui < appState.users.length; ui++) {
        if (appState.users[ui] && appState.users[ui].email === USERS[di].email) { found = true; break; }
      }
      if (!found) { appState.users.push(USERS[di]); issues.push('default user "' + USERS[di].fullname + '" missing → added'); fixed++; }
    }

    // 3. Null users cleanup
    var beforeCount = appState.users.length;
    appState.users = appState.users.filter(function(u) { return u && u.id && u.email; });
    if (appState.users.length < beforeCount) {
      issues.push((beforeCount - appState.users.length) + ' null/invalid users removed');
      fixed++;
    }

    // 4. Duplicate users by email
    var uniqueEmails = {};
    var dedupedUsers = [];
    for (var i = 0; i < appState.users.length; i++) {
      var e = appState.users[i].email;
      if (!uniqueEmails[e]) {
        uniqueEmails[e] = true;
        dedupedUsers.push(appState.users[i]);
      }
    }
    if (dedupedUsers.length < appState.users.length) {
      issues.push((appState.users.length - dedupedUsers.length) + ' duplicate users merged');
      appState.users = dedupedUsers;
      fixed++;
    }

    // 5. Book integrity
    var validBooks = [];
    for (var bi = 0; bi < appState.books.length; bi++) {
      var b = appState.books[bi];
      if (!b || !b.id || !b.title) {
        issues.push('invalid book at index ' + bi + ' → removed');
        fixed++;
        continue;
      }
      if (!b.image) b.image = 'https://placehold.co/400x600/bdc3c7/2c3e50?text=Kitob';
      if (!b.status) b.status = 'approved';
      if (!b.created_at) b.created_at = new Date().toISOString().split('T')[0];
      if (!b.genre) b.genre = 'Boshqa';
      if (!b.year) b.year = 2024;
      if (!b.language) b.language = "O'zbek";
      if (!b.pages) b.pages = 0;
      validBooks.push(b);
    }
    if (validBooks.length < appState.books.length) {
      issues.push((appState.books.length - validBooks.length) + ' broken books cleaned');
      appState.books = validBooks;
    }

    // 6. nextBookId fix
    var maxBookId = 0;
    for (var i = 0; i < appState.books.length; i++) {
      if (appState.books[i].id > maxBookId) maxBookId = appState.books[i].id;
    }
    if (appState.nextBookId <= maxBookId) {
      appState.nextBookId = maxBookId + 1;
      issues.push('nextBookId corrected to ' + appState.nextBookId);
      fixed++;
    }

    // 7. Reviews with invalid book_id or user_id
    var validReviews = [];
    for (var ri = 0; ri < appState.reviews.length; ri++) {
      var r = appState.reviews[ri];
      if (!r || !r.id || !r.book_id || !r.user_id) {
        issues.push('invalid review at index ' + ri + ' → removed');
        fixed++;
        continue;
      }
      var bookExists = appState.books.some(function(bk) { return bk.id === r.book_id; });
      var userExists = appState.users.some(function(usr) { return usr.id === r.user_id; });
      if (!bookExists) {
        issues.push('review #' + r.id + ' references deleted book → removed');
        fixed++;
        continue;
      }
      if (!userExists) {
        issues.push('review #' + r.id + ' references deleted user → kept (anonymous)');
      }
      validReviews.push(r);
    }
    if (validReviews.length < appState.reviews.length) {
      appState.reviews = validReviews;
    }

    // 8. Ratings cleanup
    var validRatings = [];
    for (var rati = 0; rati < appState.ratings.length; rati++) {
      var rt = appState.ratings[rati];
      if (!rt || !rt.book_id || !rt.user_id) continue;
      var bkExist = appState.books.some(function(bk) { return bk.id === rt.book_id; });
      if (bkExist) validRatings.push(rt);
    }
    if (validRatings.length < appState.ratings.length) {
      issues.push((appState.ratings.length - validRatings.length) + ' orphan ratings removed');
      appState.ratings = validRatings;
      fixed++;
    }

    // 9. Favorites cleanup
    var validFavs = [];
    for (var fi = 0; fi < appState.favorites.length; fi++) {
      var fv = appState.favorites[fi];
      if (!fv || !fv.book_id || !fv.user_id) continue;
      var fbExist = appState.books.some(function(bk) { return bk.id === fv.book_id; });
      if (fbExist) validFavs.push(fv);
    }
    if (validFavs.length < appState.favorites.length) {
      issues.push((appState.favorites.length - validFavs.length) + ' orphan favorites removed');
      appState.favorites = validFavs;
      fixed++;
    }

    // 10. Session check
    var sessionUser = null;
    try {
      var sessionRaw = localStorage.getItem('kitobxonUser');
      if (sessionRaw) sessionUser = JSON.parse(sessionRaw);
    } catch(e) {
      localStorage.removeItem('kitobxonUser');
      issues.push('corrupted session → cleared');
      fixed++;
    }
    if (sessionUser && sessionUser.email) {
      var sessionValid = appState.users.some(function(u) { return u.email === sessionUser.email; });
      if (!sessionValid) {
        appState.users.push(sessionUser);
        issues.push('session user not in users list → added');
        fixed++;
      }
    }

    // 11. nextReviewId fix
    var maxReviewId = 0;
    for (var i = 0; i < appState.reviews.length; i++) {
      if (appState.reviews[i].id > maxReviewId) maxReviewId = appState.reviews[i].id;
    }
    if (!appState.nextReviewId || appState.nextReviewId <= maxReviewId) {
      appState.nextReviewId = maxReviewId + 1;
    }

    // 12. nextUserId fix
    var maxUserId = 0;
    for (var i = 0; i < appState.users.length; i++) {
      if (appState.users[i].id > maxUserId) maxUserId = appState.users[i].id;
    }
    if (!appState.nextUserId || appState.nextUserId <= maxUserId) {
      appState.nextUserId = maxUserId + 1;
    }

    return { issues: issues, fixed: fixed, healthy: issues.length === 0 };
  },

  autoRepair: function() {
    var result = this.run();
    if (result.fixed > 0) {
      forceSave();
    }
    return result;
  },

  getReport: function() {
    var r = this.run();
    var stats = {
      status: r.healthy ? '✅ Sog\'lom' : '⚠️ ' + r.fixed + ' ta muammo tuzatildi',
      books: appState.books.length,
      approvedBooks: getApprovedBooks().length,
      pendingBooks: appState.books.filter(function(b) { return b.status === 'pending'; }).length,
      users: appState.users.length,
      reviews: appState.reviews.length,
      ratings: appState.ratings.length,
      favorites: appState.favorites.length,
      currentUser: appState.currentUser ? appState.currentUser.fullname : 'Yo\'q',
      localStorageSize: (new Blob([localStorage.getItem('kitobxonApp') || '']).size / 1024).toFixed(1) + ' KB',
      issues: r.issues,
      fixed: r.fixed
    };
    return stats;
  },

  nuclearReset: function() {
    localStorage.removeItem('kitobxonApp');
    localStorage.removeItem('kitobxonDataVersion');
    localStorage.removeItem('kitobxonUser');
    localStorage.removeItem('kitobxonLang');
    localStorage.removeItem('kitobxonDarkMode');
    localStorage.removeItem('kitobxonAuthors');
    location.reload();
  }
};

// Auto-run diagnostics on every page load (silent)
(function() {
  try {
    var result = DIAGNOSTICS.autoRepair();
    if (result.fixed > 0) {
      console.log('[Kitobxon Self-Heal] ' + result.fixed + ' issues auto-fixed:', result.issues);
    }
  } catch(e) {
    console.error('[Kitobxon Self-Heal] Error:', e);
  }
})();
