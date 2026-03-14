import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)

export const T = {
  fr: {
    // Nav
    home: 'Accueil', products: 'Produits', about: 'Qui sommes-nous', cart: 'Panier',
    boxes: 'Boites', bags: 'Sacs', cards: 'Cartes et Autocollants', paper: 'Papier', all: 'Tous',
    // Product
    availableSizes: 'Tailles disponibles', availableColors: 'Couleurs disponibles',
    numberOfColors: 'Nombre de couleurs dans votre design', numberOfColorsPlaceholder: 'ex: 2',
    selectColor: 'Choisir une couleur',
    colorDesignPrice: '+{price} DA / couleur',
    colorDesignMax: 'Maximum : {max} couleur(s)',
    colorDesignInfo: 'Chaque couleur supplémentaire dans votre design est facturée {price} DA/unité.',
    quantity: 'Quantité', units: 'unités', addToCart: 'Ajouter au panier',
    orderNow: 'Commander maintenant', estimatedTotal: 'Total estimé',
    doubleSided: 'Impression des deux côtés', doubleSidedExtra: '+{price} DA / unité',
    deliveryInfo: "Livraison dans toute l'Algérie", deliveryDetail: 'Paiement à la livraison · 2 à 5 jours ouvrables',
    selectSize: 'Veuillez sélectionner une taille', added: 'ajouté au panier !',
    fromPrice: 'à partir de', perUnit: '/ unité', chooseSizes: 'Choisir les tailles',
    // Cart
    myCart: 'Mon panier 🛍️', emptyCart: 'Panier vide', emptyCartDesc: 'Découvrez notre sélection d\'emballages',
    discover: 'Découvrir la boutique', continueShopping: 'Continuer mes achats',
    references: 'référence', references_pl: 'références', clear: 'Vider',
    summary: 'Récapitulatif', total: 'Total', cashOnDelivery: 'Paiement à la livraison',
    deliveryInfo2: '📦 Informations de livraison',
    // Checkout form
    firstName: 'Prénom', lastName: 'Nom', phone: 'Téléphone', wilaya: 'Wilaya',
    commune: 'Commune', selectWilaya: 'Sélectionner une wilaya',
    logoPhotos: 'Photos du logo (obligatoire, 2 max)', logoDesc: 'Votre logo sera imprimé sur l\'emballage',
    description: 'Description / instructions', descPlaceholder: 'Couleur souhaitée, texte à imprimer, instructions spéciales...',
    confirmOrder: 'Confirmer la commande', processing: 'Traitement en cours...',
    // Order confirmation popup
    popupTitle: 'Vérifiez vos informations',
    popupSubtitle: 'Assurez-vous que toutes les informations saisies sont correctes.',
    popupWarning: '⚠️ Les fausses commandes causent des pertes financières au vendeur et nuisent à d\'autres clients. Merci de votre honnêteté.',
    popupConfirm: 'Oui, confirmer ma commande',
    popupEdit: 'Modifier mes informations',
    freeDelivery: '🎉 Livraison GRATUITE ! (500+ unités)',
    errorFirstName: 'Prénom requis', errorLastName: 'Nom requis',
    errorPhone: 'Téléphone requis', errorPhoneFormat: 'Format invalide (ex: 0551234567)',
    errorWilaya: 'Wilaya requise', errorCommune: 'Commune requise',
    errorLogo: 'Au moins une photo du logo requise', errorDesc: 'Description requise',
    // Confirmation
    confirmed: 'Commande confirmée', thanks: 'Merci !',
    orderRegistered: 'Votre commande a bien été enregistrée.',
    teamContact: 'Notre équipe vous contactera pour confirmer la livraison.',
    deliveryEstimate: 'Livraison estimée', deliveryDays: '2 à 5 jours ouvrables',
    // Footer
    quickLinks: 'Liens rapides', contact: 'Contact', help: 'Aide',
    delivery69: 'Livraison 69 wilayas', returnPolicy: 'Retour sous 7 jours',
    whatsappHelp: 'Commander via WhatsApp', whatsappBtn: 'Écrire sur WhatsApp',
    // Server overload
    serverOverload: 'Serveur surchargé', serverOverloadDesc: 'Notre serveur est temporairement indisponible. Veuillez réessayer dans quelques instants.',
    retry: 'Réessayer',
    // Admin orders
    orderDetails: 'Détails de la commande', clientLogo: 'Logo du client',
    download: 'Télécharger', deleteSelected: 'Supprimer la sélection',
    confirmDelete: 'Confirmer la suppression',
    recto: 'Recto-verso',
    back: 'Retour', included: 'Inclus', switchLang: 'FR',
    // HomePage
    heroBadge: 'Emballages personnalisés', heroTitle: 'Donnez vie à votre marque',
    heroSubtitle: 'Boites, sacs, cartes et papier imprimés à votre image. Livraison partout en Algérie.',
    heroBtn1: 'Découvrir nos produits', heroBtn2: 'Commander via WhatsApp',
    stat1val: '500+', stat1label: 'Clients satisfaits',
    stat2val: '69', stat2label: 'Wilayas livrées',
    stat3val: '100%', stat3label: 'Paiement livraison',
    catSection: 'Nos catégories', catSubtitle: 'Choisissez votre type d\'emballage',
    newProducts: 'Nouveaux produits', newProductsSubtitle: 'Découvrez notre dernière sélection',
    seeAll: 'Voir tout',
    how1title: 'Choisissez votre produit', how1desc: 'Parcourez notre catalogue et sélectionnez l\'emballage qui correspond à votre marque.',
    how2title: 'Envoyez votre logo', how2desc: 'Téléversez vos fichiers logo et décrivez vos instructions de personnalisation.',
    how3title: 'Recevez votre commande', how3desc: 'Livraison dans toutes les wilayas, paiement à la réception.',
    howTitle: 'Comment ça marche ?', howSubtitle: 'En 3 étapes simples',
    reviewTitle: 'Ils nous font confiance', reviewSubtitle: 'Avis de nos clients',
    ctaTitle: 'Prêt à personnaliser vos emballages ?', ctaSubtitle: 'Livraison dans les 69 wilayas · Paiement à la livraison',
    ctaBtn: 'Commander maintenant',
    r1name: 'Karim B.', r1text: 'Qualité d\'impression excellente, les boites sont exactement comme prévu. Je recommande !',
    r2name: 'Sara M.', r2text: 'Service rapide et professionnel. Mon logo est parfaitement reproduit sur les sacs.',
    r3name: 'Yacine L.', r3text: 'Rapport qualité-prix imbattable pour des emballages personnalisés en Algérie.',
  },
  ar: {
    // Nav
    home: 'الرئيسية', products: 'المنتجات', about: 'من نحن', cart: 'السلة',
    boxes: 'صناديق', bags: 'أكياس', cards: 'بطاقات', paper: 'ورق', all: 'الكل',
    // Product
    availableSizes: 'المقاسات المتاحة', availableColors: 'الألوان المتاحة',
    numberOfColors: 'عدد الألوان في تصميمك', numberOfColorsPlaceholder: 'مثال: 2',
    selectColor: 'اختر لوناً',
    colorDesignPrice: '+{price} دج / لون',
    colorDesignMax: 'الحد الأقصى: {max} ألوان',
    colorDesignInfo: 'كل لون إضافي في تصميمك يُحتسب بـ {price} دج/وحدة.',
    quantity: 'الكمية', units: 'وحدة', addToCart: 'أضف إلى السلة',
    orderNow: 'اطلب الآن', estimatedTotal: 'المجموع التقديري',
    doubleSided: 'طباعة وجهين', doubleSidedExtra: '+{price} دج / وحدة',
    deliveryInfo: 'التوصيل لكل الجزائر', deliveryDetail: 'الدفع عند الاستلام · من 2 إلى 5 أيام',
    selectSize: 'يرجى اختيار مقاس', added: 'تمت الإضافة للسلة !',
    fromPrice: 'ابتداءً من', perUnit: '/ وحدة', chooseSizes: 'اختر المقاس',
    // Cart
    myCart: 'سلتي 🛍️', emptyCart: 'السلة فارغة', emptyCartDesc: 'اكتشف تشكيلة التغليف لدينا',
    discover: 'اكتشف المتجر', continueShopping: 'مواصلة التسوق',
    references: 'مرجع', references_pl: 'مراجع', clear: 'إفراغ',
    summary: 'ملخص الطلب', total: 'المجموع', cashOnDelivery: 'الدفع عند الاستلام',
    deliveryInfo2: '📦 معلومات التوصيل',
    // Checkout form
    firstName: 'الاسم الأول', lastName: 'اللقب', phone: 'الهاتف', wilaya: 'الولاية',
    commune: 'البلدية', selectWilaya: 'اختر الولاية',
    logoPhotos: 'صور الشعار (مطلوب، 2 كحد أقصى)', logoDesc: 'سيُطبع شعارك على التغليف',
    description: 'وصف / تعليمات', descPlaceholder: 'اللون المطلوب، النص المراد طباعته، تعليمات خاصة...',
    confirmOrder: 'تأكيد الطلب', processing: 'جارٍ المعالجة...',
    // Order confirmation popup
    popupTitle: 'تحقق من معلوماتك',
    popupSubtitle: 'تأكد من صحة جميع المعلومات التي أدخلتها.',
    popupWarning: '⚠️ الطلبات الوهمية تسبب خسائر مالية للبائع وتضر بالعملاء الآخرين. نشكرك على أمانتك.',
    popupConfirm: 'نعم، تأكيد طلبي',
    popupEdit: 'تعديل معلوماتي',
    freeDelivery: '🎉 التوصيل مجاني! (+500 وحدة)',
    errorFirstName: 'الاسم الأول مطلوب', errorLastName: 'اللقب مطلوب',
    errorPhone: 'الهاتف مطلوب', errorPhoneFormat: 'صيغة غير صحيحة (مثال: 0551234567)',
    errorWilaya: 'الولاية مطلوبة', errorCommune: 'البلدية مطلوبة',
    errorLogo: 'صورة الشعار مطلوبة', errorDesc: 'الوصف مطلوب',
    // Confirmation
    confirmed: 'تم تأكيد الطلب', thanks: 'شكراً !',
    orderRegistered: 'تم تسجيل طلبك بنجاح.',
    teamContact: 'سيتصل بك فريقنا لتأكيد التسليم.',
    deliveryEstimate: 'التسليم المتوقع', deliveryDays: 'من 2 إلى 5 أيام عمل',
    // Footer
    quickLinks: 'روابط سريعة', contact: 'التواصل', help: 'المساعدة',
    delivery69: 'توصيل 69 ولاية', returnPolicy: 'الإرجاع خلال 7 أيام',
    whatsappHelp: 'اطلب عبر واتساب', whatsappBtn: 'تواصل على واتساب',
    // Server overload
    serverOverload: 'الخادم مشغول', serverOverloadDesc: 'الخادم غير متاح مؤقتاً. يرجى إعادة المحاولة بعد لحظات.',
    retry: 'إعادة المحاولة',
    // Admin orders
    orderDetails: 'تفاصيل الطلب', clientLogo: 'شعار العميل',
    download: 'تحميل', deleteSelected: 'حذف المحدد',
    confirmDelete: 'تأكيد الحذف',
    recto: 'وجهان',
    back: 'رجوع', included: 'مشمول', switchLang: 'FR',
    // HomePage
    heroBadge: 'تغليف مخصص', heroTitle: 'أعطِ علامتك التجارية هويّتها',
    heroSubtitle: 'صناديق وأكياس وبطاقات وورق مطبوع بشعارك. توصيل لكل الجزائر.',
    heroBtn1: 'اكتشف منتجاتنا', heroBtn2: 'اطلب عبر واتساب',
    stat1val: '+500', stat1label: 'عميل راضٍ',
    stat2val: '69', stat2label: 'ولاية يشملها التوصيل',
    stat3val: '100%', stat3label: 'دفع عند الاستلام',
    catSection: 'فئاتنا', catSubtitle: 'اختر نوع التغليف المناسب لك',
    newProducts: 'منتجات جديدة', newProductsSubtitle: 'اكتشف آخر تشكيلتنا',
    seeAll: 'عرض الكل',
    how1title: 'اختر منتجك', how1desc: 'تصفّح الكتالوج واختر التغليف الذي يناسب علامتك.',
    how2title: 'أرسل شعارك', how2desc: 'ارفع ملفات الشعار وأضف تعليمات التخصيص.',
    how3title: 'استلم طلبك', how3desc: 'توصيل لكل الولايات، الدفع عند الاستلام.',
    howTitle: 'كيف يعمل؟', howSubtitle: 'في 3 خطوات بسيطة',
    reviewTitle: 'يثقون بنا', reviewSubtitle: 'آراء عملائنا',
    ctaTitle: 'هل أنت مستعد لتخصيص تغليفك؟', ctaSubtitle: 'توصيل 69 ولاية · الدفع عند الاستلام',
    ctaBtn: 'اطلب الآن',
    r1name: 'كريم ب.', r1text: 'جودة طباعة ممتازة، الصناديق بالضبط كما طلبت. أنصح بشدة!',
    r2name: 'سارة م.', r2text: 'خدمة سريعة واحترافية. شعاري مطبوع بشكل مثالي على الأكياس.',
    r3name: 'ياسين ل.', r3text: 'أفضل نسبة جودة-سعر للتغليف المخصص في الجزائر.',
  },
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar')

  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const t = (key, vars = {}) => {
    let str = T[lang]?.[key] || T.fr[key] || key
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v) })
    return str
  }

  const isRTL = lang === 'ar'

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}

export default LanguageContext