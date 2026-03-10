import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)

export const T = {
  fr: {
    // Nav
    home: 'Accueil', products: 'Produits', about: 'Qui sommes-nous', cart: 'Panier',
    boxes: 'Boites', bags: 'Sacs', cards: 'Cartes', paper: 'Papier', all: 'Tous',
    // Product
    availableSizes: 'Tailles disponibles', availableColors: 'Couleurs disponibles',
    quantity: 'Quantité', units: 'unités', addToCart: 'Ajouter au panier',
    orderNow: 'Commander maintenant', estimatedTotal: 'Total estimé',
    doubleSided: 'Impression des deux côtés', doubleSidedExtra: '+{price} DA / unité',
    deliveryInfo: "Livraison dans toute l'Algérie", deliveryDetail: 'Paiement à la livraison · 2 à 5 jours ouvrables',
    selectSize: 'Veuillez sélectionner une taille', added: 'ajouté au panier !',
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
  },
  ar: {
    // Nav
    home: 'الرئيسية', products: 'المنتجات', about: 'من نحن', cart: 'السلة',
    boxes: 'صناديق', bags: 'أكياس', cards: 'بطاقات', paper: 'ورق', all: 'الكل',
    // Product
    availableSizes: 'المقاسات المتاحة', availableColors: 'الألوان المتاحة',
    quantity: 'الكمية', units: 'وحدة', addToCart: 'أضف إلى السلة',
    orderNow: 'اطلب الآن', estimatedTotal: 'المجموع التقديري',
    doubleSided: 'طباعة وجهين', doubleSidedExtra: '+{price} دج / وحدة',
    deliveryInfo: 'التوصيل لكل الجزائر', deliveryDetail: 'الدفع عند الاستلام · من 2 إلى 5 أيام',
    selectSize: 'يرجى اختيار مقاس', added: 'تمت الإضافة للسلة !',
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
  },
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr')

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