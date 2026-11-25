import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
  Plus,
  Minus,
  RotateCcw,
  MoveUpRight,
  Menu,
  Check,
  MousePointer2,
} from "lucide-react";
const loadApartmentScene = () => import("./ApartmentScene");
const ApartmentScene = lazy(loadApartmentScene);
const rooms = [
  "Living e jantar",
  "Cozinha",
  "Suíte master",
  "Banho master",
  "Home office",
  "Varanda gourmet",
];
const photos = [
  {
    src: "/images/interior.webp",
    title: "Espaço para viver, tempo para ficar.",
    caption: "LIVING & JANTAR",
  },
  {
    src: "/images/architecture.webp",
    title: "Uma arquitetura que respira.",
    caption: "ARQUITETURA",
  },
  {
    src: "/images/penthouse.webp",
    title: "Seu horizonte particular.",
    caption: "COBERTURA",
  },
];
function App() {
  const [facadeReady, setFacadeReady] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [activeRoom, setActiveRoom] = useState<number | null>(null);
  const [zoom, setZoom] = useState(0);
  const [reset, setReset] = useState(0);
  const [gallery, setGallery] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [lightNav, setLightNav] = useState(false);
  const [type, setType] = useState("Apartamento · 248 m²");
  const [sent, setSent] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const floorCardRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const penthouse = floor === 20;
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLayoutEffect(() => {
    if (hovered === null) return;

    const card = floorCardRef.current;
    const layer = card?.parentElement;
    const highlight =
      layer?.querySelector<SVGPolygonElement>(".floor-hit.active");
    if (!card || !layer || !highlight) return;

    const visual = highlight.closest(".facade-visual");
    let frame = 0;

    const positionCard = () => {
      const facade = layer.getBoundingClientRect();
      const bounds = highlight.getBoundingClientRect();
      const scale = facade.width / layer.clientWidth;
      const floorLeft = (bounds.left - facade.left) / scale;
      const floorRight = (bounds.right - facade.left) / scale;
      const floorTop = (bounds.top - facade.top) / scale;
      const floorBottom = (bounds.bottom - facade.top) / scale;
      const anchorY = (floorTop + floorBottom) / 2;
      const gutter = 16;
      const gap = 24;
      const right = floorRight + gap;
      const left = floorLeft - gap - card.offsetWidth;
      const rightLimit = layer.clientWidth - card.offsetWidth - gutter;
      const topLimit = Math.max(
        gutter,
        layer.clientHeight - card.offsetHeight - gutter,
      );
      const topInset = Math.min(80, topLimit);
      const side =
        right <= rightLimit ? "right" : left >= gutter ? "left" : "stacked";
      const preferredTop =
        side === "stacked"
          ? floorBottom + gap <= topLimit
            ? floorBottom + gap
            : floorTop - gap - card.offsetHeight
          : anchorY - card.offsetHeight / 2;
      const top = Math.min(topLimit, Math.max(topInset, preferredTop));

      card.style.left = `${side === "right" ? right : side === "left" ? left : Math.max(gutter, rightLimit)}px`;
      card.style.top = `${top}px`;
      card.style.setProperty("--floor-line-top", `${anchorY - top}px`);
      card.style.setProperty("--floor-line-width", `${gap}px`);
      card.dataset.side = side;
    };

    const followEntrance = () => {
      positionCard();
      if (
        [...(visual?.getAnimations() ?? []), ...layer.getAnimations()].some(
          (animation) => animation.playState === "running",
        )
      ) {
        frame = requestAnimationFrame(followEntrance);
      }
    };

    const observer = new ResizeObserver(positionCard);
    observer.observe(layer);
    observer.observe(card);
    followEntrance();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [hovered, facadeReady]);

  function keepFloorCard() {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
  }
  function showFloor(value: number) {
    keepFloorCard();
    setHovered(value);
    void loadApartmentScene();
  }
  function hideFloorCard() {
    keepFloorCard();
    hoverTimer.current = setTimeout(() => setHovered(null), 350);
  }
  useEffect(
    () => () => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    },
    [],
  );
  useEffect(() => {
    const update = () => setLightNav(window.scrollY > window.innerHeight - 90);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (gallery !== null) setGallery(null);
        else {
          setFloor(null);
          setMenu(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gallery]);
  useEffect(() => {
    if (gallery !== null) {
      dialogRef.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialogRef.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [gallery]);
  function explore(value: number) {
    keepFloorCard();
    setFloor(value);
    setActiveRoom(null);
    setZoom(0);
    setHovered(null);
    setMenu(false);
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  function navigate(id: string) {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      localStorage.setItem(
        "verti-interest",
        JSON.stringify({ ...data, type, createdAt: new Date().toISOString() }),
      );
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    setSent(true);
  }
  return (
    <>
      <header className={`site-header ${lightNav ? "light" : ""}`}>
        <a
          href="#inicio"
          className="brand-pill"
          aria-label="Verti — início"
          onClick={() => {
            setFloor(null);
            setMenu(false);
          }}
        >
          <span className="wordmark">
            Verti<span className="brand-dot">.</span>
          </span>
          <span className="brand-place">Vila Nova Conceição · São Paulo</span>
        </a>
        <nav
          className={`nav-pill ${menu ? "open" : ""}`}
          aria-label="Navegação principal"
        >
          <a href="#empreendimento" onClick={() => setMenu(false)}>
            Empreendimento
          </a>
          <button onClick={() => explore(12)}>Apartamento</button>
          <button onClick={() => explore(20)}>Cobertura</button>
          <a
            className="button button-small nav-cta"
            href="#visita"
            onClick={() => setMenu(false)}
          >
            Agendar visita <ArrowUpRight size={13} />
          </a>
        </nav>
        <button
          className="mobile-menu"
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      <main>
        <section
          id="inicio"
          ref={heroRef}
          className={`hero ${floor !== null ? "exploring" : ""}`}
          aria-label="Explore os andares do Verti"
        >
          <div className="facade-layer" inert={floor !== null}>
            <div className={`facade-visual${facadeReady ? " is-ready" : ""}`}>
              <img
                className="hero-image"
                src="/images/tower-panorama.webp"
                alt="Torre residencial Verti iluminada ao anoitecer, entre as árvores de São Paulo"
                fetchPriority="high"
                onLoad={() => setFacadeReady(true)}
              />

              <svg
                className="floor-map"
                viewBox="0 0 960 600"
                preserveAspectRatio="xMidYMid meet"
                aria-label="Selecione um dos 20 andares"
              >
                {Array.from({ length: 20 }, (_, i) => {
                  const n = i + 1,
                    y = 463 - i * 20.1,
                    left = 404 + i * 0.38;
                  return (
                    <g key={n}>
                      <polygon
                        tabIndex={floor === null ? 0 : -1}
                        role="button"
                        aria-label={`Explorar ${n === 20 ? "cobertura, 20º andar" : `${n}º andar`}`}
                        points={
                          n === 20
                            ? "400,97 400,82 415,64 493,72 493,89 540,92 540,56 566,58 566,105 551,107"
                            : `${left},${y} 551,${y + 6} 551,${y + 24} ${left},${y + 18}`
                        }
                        className={
                          hovered === n ? "floor-hit active" : "floor-hit"
                        }
                        onMouseEnter={() => showFloor(n)}
                        onMouseLeave={hideFloorCard}
                        onFocus={() => showFloor(n)}
                        onBlur={hideFloorCard}
                        onClick={() => explore(n)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            explore(n);
                          }
                        }}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="hero-shade" />
            <div className="hero-copy">
              <p className="eyebrow">LANÇAMENTO · VILA NOVA CONCEIÇÃO</p>
              <h1>
                Vinte andares,
                <br />
                <em>um apartamento</em>
                <br />
                em cada.
              </h1>
              <button className="explore-hint" onClick={() => explore(12)}>
                <span className="pulse-dot" />{" "}
                <span>ESCOLHA UM ANDAR. DESCUBRA SEU LUGAR.</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div
              className={`floor-tooltip ${hovered ? "visible" : ""}`}
              ref={floorCardRef}
              onMouseEnter={keepFloorCard}
              onMouseLeave={hideFloorCard}
              onFocus={keepFloorCard}
              onBlur={hideFloorCard}
              aria-live="polite"
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow">ANDAR</span>
                <span className="availability">
                  <i /> DISPONÍVEL
                </span>
              </div>
              <div className="floor-number">
                {String(hovered ?? 12).padStart(2, "0")}
                <sup>º</sup>
              </div>
              <p>
                {hovered === 20
                  ? "Cobertura · 316 m²"
                  : "Tipo · 3 suítes · 248 m²"}
              </p>
              <button
                type="button"
                className="tooltip-action"
                tabIndex={hovered === null ? -1 : 0}
                onClick={() => {
                  if (hovered !== null) explore(hovered);
                }}
              >
                CONHEÇA A PLANTA <ArrowUpRight size={13} />
              </button>
            </div>
            <div className="hero-footer">
              <span>ARQUITETURA PARA UMA NOVA PERSPECTIVA.</span>
              <button onClick={() => navigate("empreendimento")}>
                EXPLORE O VERTI <ArrowDown size={14} />
              </button>
            </div>
            <span className="image-note">PERSPECTIVA ARTÍSTICA</span>
          </div>
          {floor !== null && (
            <div className="apartment-experience">
              <div className="scene-region">
                <button className="back-button" onClick={() => setFloor(null)}>
                  <ArrowLeft size={15} /> Voltar à fachada
                </button>
                <div className="scene-canvas">
                  <Suspense
                    fallback={
                      <div className="scene-loading">
                        <span className="loading-orbit" />
                        Preparando sua próxima perspectiva…
                      </div>
                    }
                  >
                    <ApartmentScene
                      penthouse={penthouse}
                      activeRoom={activeRoom}
                      onRoom={setActiveRoom}
                      zoom={zoom}
                      reset={reset}
                    />
                  </Suspense>
                </div>
                <div className="scene-caption">
                  <span className="eyebrow">
                    {activeRoom === null
                      ? "UMA NOVA PERSPECTIVA DE MORAR"
                      : rooms[activeRoom]}
                  </span>
                  <p>
                    <MousePointer2 size={13} /> Arraste para girar · Role para
                    aproximar
                  </p>
                </div>
                <div className="scene-tools">
                  <button
                    aria-label="Aproximar maquete"
                    onClick={() => setZoom((v) => Math.min(v + 1, 4))}
                  >
                    <Plus size={17} />
                  </button>
                  <button
                    aria-label="Afastar maquete"
                    onClick={() => setZoom((v) => Math.max(v - 1, -3))}
                  >
                    <Minus size={17} />
                  </button>
                  <span />
                  <button
                    aria-label="Restaurar perspectiva"
                    onClick={() => {
                      setActiveRoom(null);
                      setZoom(0);
                      setReset((v) => v + 1);
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
              <aside className="apartment-details">
                <div className="flex justify-between items-center">
                  <span className="eyebrow">{floor}º ANDAR</span>
                  <span className="availability">
                    <i /> DISPONÍVEL
                  </span>
                </div>
                <h2>
                  {penthouse ? "Cobertura" : "Apartamento"}
                  {!penthouse && <span>{floor}1</span>}
                </h2>
                <div className="unit-stats">
                  <div>
                    <strong>
                      {penthouse ? "316" : "248"} <small>m²</small>
                    </strong>
                    <span>área privativa</span>
                  </div>
                  <div>
                    <strong>{penthouse ? "2" : "3"}</strong>
                    <span>suítes</span>
                  </div>
                  <div>
                    <strong>{penthouse ? "6" : "4"}</strong>
                    <span>vagas</span>
                  </div>
                </div>
                <p className="unit-tagline">
                  {penthouse
                    ? "O privilégio de viver acima."
                    : "A cidade, do seu ponto de vista."}
                </p>
                <p className="unit-description">
                  {penthouse
                    ? "Um refúgio sobre a cidade. Terraço com piscina, living de canto e ambientes que se abrem para um horizonte só seu."
                    : "Um apartamento por andar, com a sala voltada para o norte. O living se abre para uma varanda generosa, e a luz acompanha a vida em cada ambiente."}
                </p>
                <div className="room-list">
                  {rooms.map((room, i) => (
                    <button
                      key={room}
                      className={activeRoom === i ? "selected" : ""}
                      onClick={() => setActiveRoom(activeRoom === i ? null : i)}
                    >
                      <span className="room-index">0{i + 1}</span>
                      {penthouse && i === 5 ? "Terraço e piscina" : room}
                      <ArrowUpRight size={12} />
                    </button>
                  ))}
                </div>
                <div className="detail-actions">
                  <button
                    className="button"
                    onClick={() => setGallery(penthouse ? 2 : 0)}
                  >
                    Ver imagens <ArrowUpRight size={13} />
                  </button>
                  <button
                    className="button button-outline"
                    onClick={() => {
                      setType(
                        penthouse
                          ? "Cobertura · 316 m²"
                          : "Apartamento · 248 m²",
                      );
                      navigate("visita");
                    }}
                  >
                    Agendar visita
                  </button>
                </div>
                <p className="model-note">
                  Maquete ilustrativa. Mobiliário e medidas referenciais.
                </p>
              </aside>
            </div>
          )}
        </section>
        <section id="empreendimento" className="introduction section-pad">
          <div className="section-heading reveal">
            <p className="eyebrow olive">
              O EXTRAORDINÁRIO ESTÁ EM SENTIR-SE EM CASA
            </p>
            <h2>
              Um endereço. <em>Vinte possibilidades.</em>
              <br />
              Uma nova perspectiva de morar.
            </h2>
            <p>
              Entre o ritmo da cidade e a calma de chegar.
              <br />
              Arquitetura que abre espaço para o que realmente importa.
            </p>
          </div>
          <div className="architecture-image reveal">
            <img
              src="/images/architecture.webp"
              alt="Detalhe das varandas e da fachada iluminada do Verti"
              loading="lazy"
            />
            <div className="architecture-card">
              <span className="eyebrow olive">01 / A ARQUITETURA</span>
              <h3>
                Dentro e fora.
                <br />
                <em>Sem fronteiras.</em>
              </h3>
              <p>
                Varandas de ponta a ponta, materiais naturais e luz em cada
                detalhe. Uma fachada que revela um jeito mais leve de viver.
              </p>
            </div>
            <button className="button image-button" onClick={() => explore(12)}>
              Explorar o prédio <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="project-facts reveal">
            <div>
              <strong>20</strong>
              <span>residências únicas</span>
            </div>
            <div>
              <strong>01</strong>
              <span>apartamento por andar</span>
            </div>
            <div>
              <strong>
                248 <small>m²</small>
              </strong>
              <span>para chamar de seu</span>
            </div>
            <div>
              <strong>
                360<small>°</small>
              </strong>
              <span>de novas perspectivas</span>
            </div>
          </div>
        </section>
        <section id="apartamentos" className="residences section-pad">
          <div className="residence-photo reveal">
            <img
              src="/images/interior.webp"
              alt="Living com mobiliário claro, acabamentos naturais e varanda integrada"
              loading="lazy"
            />
            <button
              className="round-button"
              onClick={() => setGallery(0)}
              aria-label="Ampliar imagem do living"
            >
              <Plus size={20} />
            </button>
            <span className="photo-caption">
              LIVING INTEGRADO · PERSPECTIVA ARTÍSTICA
            </span>
          </div>
          <div className="residence-copy reveal">
            <p className="eyebrow olive">AS RESIDÊNCIAS</p>
            <h2>
              Espaço para estar.
              <br />
              <em>Liberdade para ser.</em>
            </h2>
            <p>
              O conforto de uma casa. A vista de um novo horizonte. Ambientes
              integrados, três suítes e uma varanda que convida a desacelerar.
            </p>
            <div className="residence-stats">
              <span>
                <strong>248 m²</strong>área privativa
              </span>
              <span>
                <strong>3</strong>suítes
              </span>
              <span>
                <strong>4</strong>vagas
              </span>
            </div>
            <button className="button button-olive" onClick={() => explore(12)}>
              Conheça seu próximo lar <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
        <section id="cobertura" className="penthouse section-pad">
          <div className="penthouse-copy reveal">
            <p className="eyebrow olive">A COBERTURA</p>
            <h2>
              O horizonte
              <br />
              <em>é só seu.</em>
            </h2>
            <p>
              Um lugar para ver a cidade de outro jeito. Terraço aberto, piscina
              privativa e espaços desenhados para colecionar bons momentos.
            </p>
            <div className="residence-stats">
              <span>
                <strong>316 m²</strong>área privativa
              </span>
              <span>
                <strong>2</strong>suítes
              </span>
              <span>
                <strong>6</strong>vagas
              </span>
            </div>
            <button className="button button-olive" onClick={() => explore(20)}>
              Explore a cobertura <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="penthouse-photo reveal">
            <img
              src="/images/penthouse.webp"
              alt="Terraço de cobertura com piscina privativa ao entardecer"
              loading="lazy"
            />
            <button
              className="round-button"
              onClick={() => setGallery(2)}
              aria-label="Ampliar imagem da cobertura"
            >
              <Plus size={20} />
            </button>
            <span className="photo-caption">
              TERRAÇO PRIVATIVO · PERSPECTIVA ARTÍSTICA
            </span>
          </div>
        </section>
        <section className="neighborhood section-pad">
          <div className="reveal">
            <p className="eyebrow olive">VILA NOVA CONCEIÇÃO · SÃO PAULO</p>
            <h2>
              A cidade acontece.
              <br />
              <em>A vida floresce.</em>
            </h2>
          </div>
          <div className="neighborhood-copy reveal">
            <p>
              Ruas arborizadas, cafés de bairro e a liberdade de fazer tudo no
              seu tempo. O encontro entre a energia de São Paulo e a
              tranquilidade de se sentir em casa.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Vila+Nova+Conceicao+Sao+Paulo"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Conheça o bairro <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
        <section id="visita" className="visit section-pad">
          <div className="visit-copy reveal">
            <p className="eyebrow olive">SEU PRÓXIMO CAPÍTULO</p>
            <h2>
              Alguns lugares
              <br />
              <em>precisam ser</em>
              <br />
              sentidos.
            </h2>
            <p>
              Conheça cada detalhe de perto.
              <br />
              Deixe seu interesse em uma visita ao Verti.
            </p>
            <span className="visit-mark">
              V<span>.</span>
            </span>
          </div>
          <div className="visit-form-wrap reveal">
            {sent ? (
              <div className="form-success" role="status">
                <span className="success-icon">
                  <Check size={28} />
                </span>
                <h3>Um novo começo.</h3>
                <p>Seu interesse foi salvo neste dispositivo.</p>
                <p className="form-disclaimer">
                  Esta é uma experiência demonstrativa. Nenhum agendamento foi
                  enviado ou confirmado.
                </p>
                <button className="text-link" onClick={() => setSent(false)}>
                  Voltar ao formulário <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <label>
                  Seu nome
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Como podemos chamar você?"
                    required
                    minLength={2}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Telefone
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(11) 99999-9999"
                      required
                      minLength={8}
                      maxLength={20}
                    />
                  </label>
                  <label>
                    E-mail
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      required
                    />
                  </label>
                </div>
                <fieldset>
                  <legend>Qual é a sua perspectiva?</legend>
                  <div className="type-options">
                    {["Apartamento · 248 m²", "Cobertura · 316 m²"].map(
                      (item) => (
                        <button
                          type="button"
                          key={item}
                          aria-pressed={type === item}
                          className={type === item ? "active" : ""}
                          onClick={() => setType(item)}
                        >
                          {type === item && <Check size={13} />} {item}
                        </button>
                      ),
                    )}
                  </div>
                </fieldset>
                <label className="consent">
                  <input type="checkbox" required />{" "}
                  <span>
                    Concordo em registrar meus dados para demonstrar meu
                    interesse no empreendimento.
                  </span>
                </label>
                <button
                  className="button button-olive submit-button"
                  type="submit"
                >
                  Registrar interesse <ArrowUpRight size={16} />
                </button>
                <p className="form-disclaimer">
                  Experiência demonstrativa. O envio não confirma uma visita.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <a className="wordmark" href="#inicio">
          Verti.
        </a>
        <span>Uma nova perspectiva de morar.</span>
        <p>
          Projeto conceitual · Imagens, plantas e disponibilidade ilustrativas.
        </p>
        <a href="#inicio" aria-label="Voltar ao topo">
          <MoveUpRight size={20} />
        </a>
      </footer>
      <dialog
        ref={dialogRef}
        className="gallery-dialog"
        onCancel={() => setGallery(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setGallery(null);
        }}
      >
        {gallery !== null && (
          <div className="gallery-content">
            <button
              className="gallery-close round-button"
              onClick={() => setGallery(null)}
              aria-label="Fechar galeria"
            >
              <X size={22} />
            </button>
            <img src={photos[gallery].src} alt={photos[gallery].title} />
            <div className="gallery-bottom">
              <div>
                <p className="eyebrow">{photos[gallery].caption}</p>
                <h3>{photos[gallery].title}</h3>
              </div>
              <div className="gallery-controls">
                <button
                  aria-label="Imagem anterior"
                  onClick={() => setGallery((gallery + 2) % 3)}
                >
                  <ArrowLeft size={20} />
                </button>
                <span>0{gallery + 1} / 03</span>
                <button
                  aria-label="Próxima imagem"
                  onClick={() => setGallery((gallery + 1) % 3)}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
export default App;
