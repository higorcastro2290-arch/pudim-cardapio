"use client";

import { useMemo, useState } from "react";

type Product = {
  name: string;
  price: number;
  note: string;
  badge: string;
  image: string;
  size: string;
  badgeClassName: string;
};

type CheckoutForm = {
  customerName: string;
  whatsapp: string;
  fulfillmentMethod: string;
  deliveryAddress: string;
  deliveryNeighborhood: string;
  deliveryReference: string;
  pickupDate: string;
  pickupTime: string;
  notes: string;
};

const whatsappNumber = "5562984735298";

const featuredSweets: Product[] = [
  {
    name: "Copudim 300ml",
    price: 15,
    note: "Uma sobremesa de colher com creme de doce de leite, chantilly aerado, pedacos de pudim e mini pudim gourmet finalizando no topo.",
    badge: "Lancamento",
    image: "/copudim.png",
    size: "300ml",
    badgeClassName: "bg-[var(--color-peach)] text-[var(--color-caramel)]",
  },
  {
    name: "Mini Pudim Tradicional",
    price: 7,
    note: "O classico que todo mundo ama: massa lisinha, sabor caseiro e bastante calda de caramelo.",
    badge: "Tradicional",
    image: "/mini tradicional.png",
    size: "Mini",
    badgeClassName: "bg-[#ffe7b8] text-[#8f5b00]",
  },
  {
    name: "Mini Pudim de Chocolate",
    price: 10,
    note: "Mais intenso e envolvente, com sabor de chocolate para quem quer uma versao diferente do tradicional.",
    badge: "Chocolate",
    image: "/mini chocolate.png",
    size: "Mini",
    badgeClassName: "bg-[#5b3425] text-[#fff2e8]",
  },
  {
    name: "Mini Pudim de Ninho",
    price: 10,
    note: "Cremoso, delicado e com aquele sabor suave e aconchegante de leite ninho.",
    badge: "Ninho",
    image: "/mini ninho.png",
    size: "Mini",
    badgeClassName: "bg-[#f7f0cf] text-[#8a6a10]",
  },
  {
    name: "Pudim Tradicional 1100ml",
    price: 45,
    note: "Versao grande do classico da casa, ideal para compartilhar, servir em encomendas especiais e destacar a cremosidade com bastante calda de caramelo.",
    badge: "Familia",
    image: "/tradicional 1100ML.png",
    size: "1100ml",
    badgeClassName: "bg-[#ffe7b8] text-[#8f5b00]",
  },
];

const orderSteps = [
  "Escolha os doces e a quantidade ideal para sua encomenda.",
  "Agende a data e o horario para retirada ou entrega.",
  "Receba a confirmacao e acompanhe o preparo do pedido.",
];

const stats = [
  { value: "48h", label: "antecedencia ideal para encomendas" },
  { value: "5", label: "sabores disponiveis no cardapio" },
  { value: "Retirada e entrega", label: "pedido organizado para receber ou buscar no horario combinado" },
];

const serviceHighlights = [
  {
    title: "Encomenda antecipada",
    description: "Faca seu pedido com antecedencia para garantir disponibilidade e organizar retirada ou entrega.",
  },
  {
    title: "Atendimento pelo WhatsApp",
    description: "Envie seu pedido em poucos cliques e confirme detalhes direto com a loja.",
  },
  {
    title: "Produtos artesanais",
    description: "Pudins preparados com cuidado, visual caprichado e sabor marcante para vender bem.",
  },
];

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function Home() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    customerName: "",
    whatsapp: "",
    fulfillmentMethod: "retirada",
    deliveryAddress: "",
    deliveryNeighborhood: "",
    deliveryReference: "",
    pickupDate: "",
    pickupTime: "",
    notes: "",
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cartItems = useMemo(
    () =>
      featuredSweets
        .map((product) => ({
          ...product,
          quantity: cart[product.name] ?? 0,
          total: (cart[product.name] ?? 0) * product.price,
        }))
        .filter((product) => product.quantity > 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.total, 0),
    [cartItems]
  );

  const cartSummary = useMemo(() => {
    if (cartItems.length === 0) {
      return "Adicione os produtos para montar seu pedido";
    }

    return cartItems.map((item) => `${item.quantity} ${item.name}`).join(", ");
  }, [cartItems]);

  const updateCart = (name: string, delta: number) => {
    setCart((current) => {
      const nextValue = Math.max((current[name] ?? 0) + delta, 0);

      return {
        ...current,
        [name]: nextValue,
      };
    });
  };

  const updateCheckoutField = (field: keyof CheckoutForm, value: string) => {
    setCheckoutForm((current) => {
      if (field === "fulfillmentMethod" && value === "retirada") {
        return {
          ...current,
          fulfillmentMethod: value,
          deliveryAddress: "",
          deliveryNeighborhood: "",
          deliveryReference: "",
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  };

  const createWhatsappLink = (message: string) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  const cartWhatsappLink = createWhatsappLink(
    cartItems.length
      ? `Ola! Gostaria de fazer um pedido:\n- ${cartItems
          .map((item) => `${item.quantity}x ${item.name} (${formatCurrency(item.total)})`)
          .join("\n- ")}\nTotal estimado: ${formatCurrency(cartTotal)}`
      : "Ola! Gostaria de saber mais sobre os produtos da Priscila Siqueira Pudim Gourmet."
  );

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      setSubmitError("Adicione pelo menos um produto antes de enviar o pedido.");
      setSubmitMessage(null);
      return;
    }

    if (
      !checkoutForm.customerName.trim() ||
      !checkoutForm.whatsapp.trim() ||
      !checkoutForm.fulfillmentMethod.trim() ||
      !checkoutForm.pickupDate ||
      !checkoutForm.pickupTime
    ) {
      setSubmitError("Preencha nome, WhatsApp, forma de recebimento, data e horario para salvar o pedido.");
      setSubmitMessage(null);
      return;
    }

    if (
      checkoutForm.fulfillmentMethod === "entrega" &&
      (!checkoutForm.deliveryAddress.trim() ||
        !checkoutForm.deliveryNeighborhood.trim())
    ) {
      setSubmitError("Para entrega, preencha endereco e bairro.");
      setSubmitMessage(null);
      return;
    }

    setIsSubmittingOrder(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: checkoutForm.customerName,
          whatsapp: checkoutForm.whatsapp,
          fulfillmentMethod: checkoutForm.fulfillmentMethod,
          deliveryAddress: checkoutForm.deliveryAddress,
          deliveryNeighborhood: checkoutForm.deliveryNeighborhood,
          deliveryReference: checkoutForm.deliveryReference,
          pickupDate: checkoutForm.pickupDate,
          pickupTime: checkoutForm.pickupTime,
          notes: checkoutForm.notes,
          items: cartItems.map((item) => ({
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
        orderId?: number;
      };

      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel salvar o pedido.");
      }

      setSubmitMessage(`Pedido #${result.orderId} salvo com sucesso.`);
      setCheckoutForm({
        customerName: "",
        whatsapp: "",
        fulfillmentMethod: "retirada",
        deliveryAddress: "",
        deliveryNeighborhood: "",
        deliveryReference: "",
        pickupDate: "",
        pickupTime: "",
        notes: "",
      });
      setCart({});
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Nao foi possivel salvar o pedido."
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <main className="bg-[var(--color-cream)] text-[var(--color-ink)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,212,184,0.95),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(191,221,224,0.42),_transparent_30%),linear-gradient(180deg,#fff0e2_0%,#fff8f1_62%,#fff3e6_100%)]" />
        <div className="absolute left-[-10%] top-8 h-56 w-56 rounded-full bg-[rgba(184,90,18,0.12)] blur-3xl" />
        <div className="absolute right-[-5%] top-24 h-64 w-64 rounded-full bg-[rgba(191,221,224,0.5)] blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
          <header className="mb-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="overflow-hidden rounded-full border-2 border-[rgba(255,248,241,0.9)] bg-white shadow-[0_12px_30px_rgba(143,63,0,0.28)]">
                <div
                  className="h-16 w-16 bg-[radial-gradient(circle_at_40%_35%,#d97b18_0%,#b85a12_62%,#8f3f00_100%)] bg-cover bg-center"
                  style={{ backgroundImage: "url('/logo.png')" }}
                />
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.04em] text-[var(--color-caramel)]">
                  Priscila Siqueira
                </p>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Pudim Gourmet
                </p>
              </div>
            </div>
            <div className="hidden text-right text-sm text-[var(--color-muted)] md:block">
              <p>Pre-encomendas para retirada e entrega</p>
              <p className="font-semibold text-[var(--color-syrup)]">(62) 9 8473-5298</p>
            </div>
            <a
              href="#pedido"
              className="rounded-full border border-[var(--color-caramel)] bg-white/80 px-5 py-2 text-sm font-semibold text-[var(--color-caramel)] transition hover:bg-[var(--color-caramel)] hover:text-white"
            >
              Fazer pre-pedido
            </a>
          </header>

          <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-[rgba(184,90,18,0.15)] bg-white/75 px-4 py-2 text-sm text-[var(--color-caramel)] shadow-sm backdrop-blur">
                Pudins e doces sob encomenda com retirada e entrega
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
                  Pudins e sobremesas artesanais para encomendar com antecedencia.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] sm:text-xl">
                  Escolha seus sabores favoritos, ajuste as quantidades e envie seu pedido com praticidade
                  pelo WhatsApp para retirada ou entrega no horario combinado.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <a
                  href="#cardapio"
                  className="rounded-full bg-[var(--color-caramel)] px-7 py-4 text-center text-base font-semibold text-white shadow-[0_16px_40px_rgba(123,43,26,0.28)] transition hover:-translate-y-0.5 hover:bg-[var(--color-caramel-dark)]"
                >
                  Ver cardapio
                </a>
                <a
                  href={cartWhatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[rgba(123,43,26,0.18)] bg-white/70 px-7 py-4 text-center text-base font-semibold text-[var(--color-ink)] transition hover:bg-white"
                >
                  Fechar no WhatsApp
                </a>
              </div>

              <div className="grid gap-4 pt-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <article
                    key={stat.label}
                    className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_20px_40px_rgba(140,58,18,0.08)] backdrop-blur"
                  >
                    <p className="text-3xl font-bold text-[var(--color-caramel)]">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{stat.label}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-14 hidden h-32 w-32 rounded-full bg-[rgba(184,90,18,0.18)] blur-2xl lg:block" />
              <div className="absolute -right-6 bottom-10 hidden h-40 w-40 rounded-full bg-[rgba(191,221,224,0.95)] blur-2xl lg:block" />

              <div className="relative rounded-[36px] border border-[rgba(184,90,18,0.12)] bg-[linear-gradient(180deg,rgba(255,248,241,0.96)_0%,rgba(255,255,255,0.94)_100%)] p-6 shadow-[0_30px_80px_rgba(140,58,18,0.14)]">
                <div className="mb-6 overflow-hidden rounded-[28px] border border-[rgba(184,90,18,0.12)] bg-[linear-gradient(135deg,#fff4ea_0%,#ffd9be_100%)] p-3">
                  <div
                    className="h-64 rounded-[22px] bg-[linear-gradient(140deg,#8f3f00_0%,#c86e14_44%,#ffd9be_100%)] bg-cover bg-center bg-no-repeat sm:h-72"
                    style={{ backgroundImage: "url('/copudim.png')" }}
                  />
                </div>

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-md">
                    <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Destaque da casa
                    </p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                      Copudim especial
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                      O destaque da vitrine: um pote de 300ml montado para impressionar na primeira colherada,
                      com textura cremosa, camadas generosas e finalizacao com mini pudim gourmet.
                    </p>
                  </div>
                  <div className="space-y-2 sm:text-right">
                    <span className="inline-flex rounded-full bg-[var(--color-peach)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-caramel)]">
                      300ml
                    </span>
                    <p className="text-3xl font-bold text-[var(--color-syrup)]">{formatCurrency(15)}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Pronto para encomenda
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {featuredSweets.map((sweet) => (
                    <article
                      key={sweet.name}
                      className="rounded-[26px] border border-[rgba(184,90,18,0.08)] bg-white px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span
                            className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${sweet.badgeClassName}`}
                          >
                            {sweet.badge}
                          </span>
                          <h3 className="text-lg font-semibold">{sweet.name}</h3>
                          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{sweet.note}</p>
                        </div>
                        <strong className="text-lg text-[var(--color-caramel)]">
                          {formatCurrency(sweet.price)}
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 rounded-[28px] bg-[linear-gradient(135deg,var(--color-syrup)_0%,var(--color-caramel-dark)_100%)] p-5 text-white">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>{cartItems.length ? "Total estimado" : "Seu pedido"}</span>
                    <span>{cartItems.length ? "Carrinho ativo" : "Comece pelo cardapio"}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-bold">{formatCurrency(cartTotal)}</p>
                      <p className="mt-1 text-sm text-white/70">{cartSummary}</p>
                    </div>
                    <a
                      href={cartWhatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[var(--color-vanilla)] px-4 py-2 text-sm font-semibold text-[var(--color-syrup)] transition hover:bg-[var(--color-peach-soft)]"
                    >
                      Enviar no WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cardapio" className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--color-caramel)]">
              Cardapio
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
              Escolha os sabores que vao para o seu pedido.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-[var(--color-muted)]">
            Veja os produtos disponiveis, ajuste as quantidades e envie sua encomenda em poucos passos.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredSweets.map((sweet) => {
            const quantity = cart[sweet.name] ?? 0;
            const singleProductWhatsappLink = createWhatsappLink(
              `Ola! Quero pedir ${quantity > 0 ? quantity : 1}x ${sweet.name} por ${formatCurrency(
                sweet.price
              )} cada.`
            );

            return (
              <article
                key={sweet.name}
                className="group overflow-hidden rounded-[30px] border border-[rgba(184,90,18,0.1)] bg-white shadow-[0_18px_45px_rgba(140,58,18,0.08)] transition hover:-translate-y-1"
              >
                <div className="h-56 bg-[linear-gradient(140deg,#8f3f00_0%,#c86e14_44%,#ffd9be_100%)] p-3 text-white">
                  <div
                    className="h-full rounded-[24px] border border-white/20 bg-white/10 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('${sweet.image}')` }}
                  />
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${sweet.badgeClassName}`}
                    >
                      {sweet.badge}
                    </span>
                    <strong className="text-lg text-[var(--color-caramel)]">
                      {formatCurrency(sweet.price)}
                    </strong>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{sweet.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{sweet.note}</p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    {sweet.size}
                  </p>

                  <div className="rounded-[22px] bg-[var(--color-cream)] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Quantidade no carrinho
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCart(sweet.name, -1)}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(184,90,18,0.18)] text-xl font-semibold text-[var(--color-caramel)] transition hover:bg-white"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-lg font-bold text-[var(--color-syrup)]">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCart(sweet.name, 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(184,90,18,0.18)] text-xl font-semibold text-[var(--color-caramel)] transition hover:bg-white"
                        >
                          +
                        </button>
                      </div>
                      <strong className="text-sm text-[var(--color-syrup)]">
                        {formatCurrency(quantity * sweet.price)}
                      </strong>
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      {quantity > 0
                        ? "Produto adicionado. Voce pode ajustar a quantidade aqui."
                        : "Nenhuma unidade adicionada ainda."}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => updateCart(sweet.name, 1)}
                      className="w-full rounded-full bg-[var(--color-syrup)] px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-[var(--color-caramel)]"
                    >
                      {quantity > 0 ? "Adicionar mais um" : "Adicionar ao carrinho"}
                    </button>
                    <a
                      href={singleProductWhatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full rounded-full border border-[rgba(184,90,18,0.18)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--color-caramel)] transition hover:bg-[var(--color-cream)]"
                    >
                      Pedir no WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="gestao"
        className="bg-[linear-gradient(135deg,var(--color-syrup)_0%,var(--color-caramel-dark)_52%,#6f2f00_100%)] text-white"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--color-peach-soft)]">
              Como encomendar
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
              Um processo simples para pedir e retirar.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
              Escolha os produtos, monte o carrinho e envie tudo pelo WhatsApp. Assim o atendimento fica
              rapido e sua retirada ou entrega acontece com mais organizacao.
            </p>
          </div>

          <div className="grid gap-5">
            {orderSteps.map((step, index) => (
              <article
                key={step}
                className="rounded-[28px] border border-white/10 bg-white/6 p-6 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-plate)] text-sm font-bold text-[var(--color-syrup)]">
                    0{index + 1}
                  </span>
                  <p className="pt-1 text-base leading-7 text-white/85">{step}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pedido" className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[34px] bg-[linear-gradient(160deg,#fff8f1_0%,#ffd9be_100%)] p-8 shadow-[0_24px_60px_rgba(140,58,18,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--color-caramel)]">
              Finalizar pedido
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
              Confirme seus dados para retirada ou entrega.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
              Informe seus dados, escolha retirada ou entrega, defina o horario e envie o resumo do pedido para atendimento.
            </p>
          </div>

          <form
            onSubmit={submitOrder}
            className="grid gap-4 rounded-[34px] border border-[rgba(184,90,18,0.1)] bg-white p-6 shadow-[0_24px_60px_rgba(140,58,18,0.08)] sm:grid-cols-2"
          >
            <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
              Nome
              <input
                type="text"
                placeholder="Seu nome"
                value={checkoutForm.customerName}
                onChange={(event) => updateCheckoutField("customerName", event.target.value)}
                className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
              WhatsApp
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={checkoutForm.whatsapp}
                onChange={(event) => updateCheckoutField("whatsapp", event.target.value)}
                className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
              Forma de recebimento
              <select
                value={checkoutForm.fulfillmentMethod}
                onChange={(event) => updateCheckoutField("fulfillmentMethod", event.target.value)}
                className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
              >
                <option value="retirada">Retirada</option>
                <option value="entrega">Entrega</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
              Data do pedido
              <input
                type="date"
                value={checkoutForm.pickupDate}
                onChange={(event) => updateCheckoutField("pickupDate", event.target.value)}
                className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
              />
            </label>
            {checkoutForm.fulfillmentMethod === "entrega" && (
              <>
                <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)] sm:col-span-2">
                  Endereco de entrega
                  <input
                    type="text"
                    placeholder="Rua, numero e complemento"
                    value={checkoutForm.deliveryAddress}
                    onChange={(event) =>
                      updateCheckoutField("deliveryAddress", event.target.value)
                    }
                    className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                  Bairro
                  <input
                    type="text"
                    placeholder="Seu bairro"
                    value={checkoutForm.deliveryNeighborhood}
                    onChange={(event) =>
                      updateCheckoutField("deliveryNeighborhood", event.target.value)
                    }
                    className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                  Ponto de referencia
                  <input
                    type="text"
                    placeholder="Ex.: perto da igreja, casa de esquina"
                    value={checkoutForm.deliveryReference}
                    onChange={(event) =>
                      updateCheckoutField("deliveryReference", event.target.value)
                    }
                    className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
                  />
                </label>
              </>
            )}
            <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
              Horario desejado
              <input
                type="time"
                value={checkoutForm.pickupTime}
                onChange={(event) => updateCheckoutField("pickupTime", event.target.value)}
                className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)] sm:col-span-2">
              Observacoes
              <textarea
                rows={4}
                placeholder="Ex.: retirar apos as 18h, entregar com cuidado, separar em duas caixas..."
                value={checkoutForm.notes}
                onChange={(event) => updateCheckoutField("notes", event.target.value)}
                className="rounded-3xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-caramel)]"
              />
            </label>
            <div className="sm:col-span-2 rounded-[26px] bg-[linear-gradient(135deg,var(--color-syrup)_0%,var(--color-caramel-dark)_100%)] p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/60">Resumo do pedido</p>
                  <p className="mt-1 font-semibold">{cartSummary}</p>
                </div>
                <strong className="text-2xl">{formatCurrency(cartTotal)}</strong>
              </div>
            </div>
            {(submitError || submitMessage) && (
              <div
                className={`sm:col-span-2 rounded-3xl px-4 py-3 text-sm ${
                  submitError
                    ? "bg-[#fff0eb] text-[#8f3f00]"
                    : "bg-[#edf8ef] text-[#22663b]"
                }`}
              >
                {submitError || submitMessage}
              </div>
            )}
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="rounded-full bg-[var(--color-caramel)] px-6 py-4 text-center text-base font-semibold text-white transition hover:bg-[var(--color-caramel-dark)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingOrder ? "Salvando pedido..." : "Salvar pedido"}
              </button>
              <a
                href={cartWhatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[rgba(184,90,18,0.18)] bg-white px-6 py-4 text-center text-base font-semibold text-[var(--color-caramel)] transition hover:bg-[var(--color-cream)]"
              >
                Enviar no WhatsApp
              </a>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-24 sm:px-10 lg:px-12">
        <div className="grid gap-8 rounded-[36px] bg-white p-6 shadow-[0_25px_70px_rgba(140,58,18,0.08)] sm:p-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--color-caramel)]">
              Atendimento
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
              Informacoes importantes para sua encomenda.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-[var(--color-muted)]">
              Trabalhamos com pedidos sob encomenda para garantir mais organizacao, melhor atendimento e
              produtos preparados com o cuidado que a sua marca merece.
            </p>
          </div>

          <div className="rounded-[30px] border border-[rgba(184,90,18,0.1)] bg-[linear-gradient(180deg,var(--color-cream)_0%,#fff2e7_100%)] p-4">
            <div className="grid gap-3">
              {serviceHighlights.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col gap-4 rounded-[24px] bg-white p-5 shadow-[0_12px_30px_rgba(140,58,18,0.06)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">{item.title}</p>
                    <p className="text-sm leading-6 text-[var(--color-muted)]">{item.description}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-[var(--color-plate)] px-4 py-2 text-sm font-semibold text-[var(--color-syrup)]">
                    Atendimento
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


