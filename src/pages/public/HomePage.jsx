import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import ProductGrid from '../../Components/public/ProductGrid'

// Catégories emballage — liées aux vraies catégories produit
const CATEGORIES = [
  {
    label: 'Board',
    cat: 'Board',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGfAvfWSR8bu0wmmm95vnqzfXIaa1hdYV5Gup6wGAbZ8kRvMjs9y_jI4_8kudr1b11v--Mgdmws62ZF3zjmtTbY_AscSGbEARN8eQWPCa2_P2CYuKwolNoqZ5Rl8tw2mxP5G7UQP1Bhy7EITPCdpiqsrvhuJyZDwj241VoAPyQiddWs3L3iFLbssVAWz2aJeA_sJHyRUVSKMs_vHYjZNcevD_V3ohy3QYeCipmDmyOEgPduNuOuH0Ot2aXbi6Zu9KFDe5Z4a46Al_w',
  },
  {
    label: 'Bags',
    cat: 'Bags',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADxj4BI_NVl-s99H4R-ZpO-qJUHwUULOvTrSrby23QlxF3vNbc-9qRNMLR-DQeSFV53lJpxtqHvECRPdSFPfUlz_ouHsTMRFuoZof4sxfQ04zxNoWuGIuA9CXWGw8YMrlbdRIyIrw6pVAT-Krh_E7QAvJdVfwChQS9JUj1sF3xBEHqLOtkpHkt_Na3Ka6IbtfgDcsOVF8NSVlTlRBjogr7QkWsw7vov92ssPUi6NhA2LWKGureTFTandFnlwSAz3MDpsDt3w9ClNzm',
  },
  {
    label: 'Autocollants',
    cat: 'Autocollants',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEx0R3J-YYGzVTABQGbpVxdXJCDGcgymr-lsd_1wssyXPxRf6xK6UaTJc7OTiz8WYgXR4rLuq2WLzbLmDg3uxuglGPkthMw8w2t7C5XGkSGbRxfQ6zeLjAaUOw1hO5A9ZrLLwsFwxudP6dOnGjTfdj1HDZcqUmwG_2ojtY-wZmx_HuYFY6wjCE21axH3GQjn3fosq0kfDJBKa6y_lzLSE-S9-Yg45nu7nDzBXd37MZshGGZlPsQ5sKPVoB20BNzxX2zyWMwNPZQ_zs',
  },
  {
    label: 'Paper',
    cat: 'Paper',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIHm9A-gXfCktkku8k_XSdW-N4B3PrJmjTeKqnDKcA1sYJQh3XtKv6O-OYBwamWcc_xMmz3EecN43Tr6HNOQjzC2FCt6QCfp7sADSLB-erxtUmgNEoqiowT2ti7kTtQN0lumTdZy2uErOKV_22XR04f7lWs6onuGMAuST4Bogk8XxeimXVzfvdMlY3YSnJC-yIVeNPjDcI5SfD1MmWfAddQD8Nj0hQ5A0fTB4JzY35Z8t8gi4zruH7GiTB6yYhYKdw5qtelSd9iKDs',
  },
]

const STEPS = [
  { n: '1', title: 'Choose',    desc: 'Select your canvas from our curated heritage materials.' },
  { n: '2', title: 'Customize', desc: 'Infuse it with your magic using our artisanal patterns.' },
  { n: '3', title: 'Submit',    desc: 'Our artisans breathe life into your creation.' },
]

function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts((res.data || []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-bg-light">

      {/* ── Hero ── */}
      <header className="px-4 py-6 pt-20">
        <div className="relative overflow-hidden rounded-xl bg-charcoal
                        flex items-center justify-center min-h-[320px] md:min-h-[420px]">
          <div className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(75,32,56,0.5), rgba(34,22,16,0.85)),
                url('https://lh3.googleusercontent.com/aida-public/AB6AXuD7mbrzcJIgPI4so6KZXOZrLt625iDsmVMNKbME08QxBZnctKkEtwLSA_NPMWbwFFlExJicldH3lQtemlzfC6Py94SqibdIAC7Vf2nu5nAcIpmIsVUTEoen7_svmTPCAhKw8COVf4swHtfMmCpYgQgjEK6WlkO8k2Wwhgz4kEJ6qNYMCxkWN33k5ECSbnzNe05dgxARO4FWu6NTHuc9Pa3mn_wqtXaLaZ6HqSD4kKJK4zDEoGpIacVMQk3tNO2y3n2YqexR2LJ8dFbg')`,
            }}
          />
          <div className="absolute top-10 right-10 text-gold/40 animate-pulse text-5xl select-none">✦</div>
          <div className="relative z-10 w-full flex flex-col items-center text-center px-6 py-16 max-w-2xl mx-auto">
            <span className="text-gold uppercase tracking-[0.3em] text-xs font-semibold mb-3">
              Heritage Meets Magic
            </span>
            <h1 className="text-white text-4xl md:text-6xl font-black leading-tight mb-5 italic">
              Old Money Meets Magic
            </h1>
            <p className="text-white/75 text-sm md:text-base mb-8 leading-relaxed max-w-lg">
              Discover our magical workshop blending Algerian heritage with whimsical fairy charm.
              Hand-crafted treasures for the soulful collector.
            </p>
            <button onClick={() => navigate('/products')}
              className="bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-full
                         font-bold transition-all transform hover:scale-105 shadow-dark">
              Enter the Workshop
            </button>
          </div>
        </div>
      </header>

      {/* ── Enchanted Collections ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-mauve text-3xl font-bold mb-8 text-center italic">
          Enchanted Collections
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map(({ label, cat, image }) => (
            <Link key={label} to={`/products?category=${cat}`} className="group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl fairy-glow
                              transition-transform duration-500 group-hover:-translate-y-2">
                <img src={image} alt={label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-mauve/80 to-transparent
                                flex items-end p-6">
                  <p className="text-white text-xl font-bold italic tracking-wide">{label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── The Path of Creation ── */}
      <section className="bg-mauve/5 py-16 px-4 my-12">
        <div className="max-w-4xl mx-auto scroll-texture border-y-8 border-mauve/20
                        rounded-3xl p-8 md:p-12 shadow-inner relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-mauve text-gold
                          px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest
                          shadow-fairy whitespace-nowrap">
            The Path of Creation
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center relative z-10">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-mauve text-white flex items-center
                                justify-center mb-4 text-2xl font-bold shadow-fairy">
                  {n}
                </div>
                <h3 className="text-mauve font-bold text-lg mb-2 italic">{title}</h3>
                <p className="text-mauve/70 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Produits ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-mauve text-3xl font-bold mb-8 text-center italic">
          Our Latest Creations
        </h2>
        <ProductGrid products={products} loading={loading} />
      </section>

    </div>
  )
}

export default HomePage