"use client";

import { useMemo, useState } from "react";
import type { OrderStatus, ProductSalesSummary, SavedOrder } from "@/lib/db";

const orderStatuses: OrderStatus[] = ["novo", "em preparo", "pronto", "entregue"];

const statusStyles: Record<OrderStatus, string> = {
  novo: "bg-[#fff1cf] text-[#8a5d00]",
  "em preparo": "bg-[#ffe0d1] text-[#8f3f00]",
  pronto: "bg-[#e4f6e8] text-[#22663b]",
  entregue: "bg-[#dceff2] text-[#275e6a]",
};

const fulfillmentStyles: Record<string, string> = {
  retirada: "bg-[#fff3d8] text-[#8a5d00]",
  entrega: "bg-[#e7f3ff] text-[#215f8f]",
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

type EditableForm = {
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

type AdminDashboardProps = {
  initialOrders: SavedOrder[];
  initialProductSales: ProductSalesSummary[];
};

export function AdminDashboard({
  initialOrders,
  initialProductSales,
}: AdminDashboardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [productSales, setProductSales] = useState(initialProductSales);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | OrderStatus>("todos");
  const [dateFilter, setDateFilter] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<EditableForm | null>(null);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesStatus = statusFilter === "todos" || order.status === statusFilter;
        const matchesDate = !dateFilter || order.pickupDate === dateFilter;
        return matchesStatus && matchesDate;
      }),
    [orders, statusFilter, dateFilter]
  );

  const refreshAdminData = async () => {
    const response = await fetch("/api/admin/orders");
    const result = (await response.json()) as {
      error?: string;
      orders?: SavedOrder[];
      productSales?: ProductSalesSummary[];
    };

    if (!response.ok || !result.orders || !result.productSales) {
      throw new Error(result.error || "Nao foi possivel carregar os pedidos.");
    }

    setOrders(result.orders);
    setProductSales(result.productSales);
  };

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    setPendingOrderId(orderId);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status }),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
        order?: SavedOrder;
      };

      if (!response.ok || !result.order) {
        throw new Error(result.error || "Nao foi possivel atualizar o status.");
      }

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? result.order! : order))
      );
      setFeedback(`Pedido #${orderId} atualizado para ${status}.`);
      await refreshAdminData();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Nao foi possivel atualizar o status."
      );
    } finally {
      setPendingOrderId(null);
    }
  };

  const startEditing = (order: SavedOrder) => {
    setEditingOrderId(order.id);
    setEditingForm({
      customerName: order.customerName,
      whatsapp: order.whatsapp,
      fulfillmentMethod: order.fulfillmentMethod,
      deliveryAddress: order.deliveryAddress,
      deliveryNeighborhood: order.deliveryNeighborhood,
      deliveryReference: order.deliveryReference,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      notes: order.notes,
    });
    setError(null);
    setFeedback(null);
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    setEditingForm(null);
  };

  const saveEdit = async (order: SavedOrder) => {
    if (!editingForm) {
      return;
    }

    setPendingOrderId(order.id);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "edit",
          orderId: order.id,
          customerName: editingForm.customerName,
          whatsapp: editingForm.whatsapp,
          fulfillmentMethod: editingForm.fulfillmentMethod,
          deliveryAddress: editingForm.deliveryAddress,
          deliveryNeighborhood: editingForm.deliveryNeighborhood,
          deliveryReference: editingForm.deliveryReference,
          pickupDate: editingForm.pickupDate,
          pickupTime: editingForm.pickupTime,
          notes: editingForm.notes,
          items: order.items.map((item) => ({
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        order?: SavedOrder;
      };

      if (!response.ok || !result.order) {
        throw new Error(result.error || "Nao foi possivel editar o pedido.");
      }

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id ? result.order! : currentOrder
        )
      );
      setFeedback(`Pedido #${order.id} atualizado com sucesso.`);
      cancelEditing();
      await refreshAdminData();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Nao foi possivel editar o pedido."
      );
    } finally {
      setPendingOrderId(null);
    }
  };

  const removeOrder = async (orderId: number) => {
    const confirmed = window.confirm(`Deseja excluir o pedido #${orderId}?`);

    if (!confirmed) {
      return;
    }

    setPendingOrderId(orderId);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel excluir o pedido.");
      }

      setOrders((current) => current.filter((order) => order.id !== orderId));
      setFeedback(`Pedido #${orderId} excluido com sucesso.`);
      if (editingOrderId === orderId) {
        cancelEditing();
      }
      await refreshAdminData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Nao foi possivel excluir o pedido."
      );
    } finally {
      setPendingOrderId(null);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[var(--color-cream)] px-6 py-8 text-[var(--color-ink)] sm:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[32px] border border-[rgba(184,90,18,0.1)] bg-white p-6 shadow-[0_20px_50px_rgba(140,58,18,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-caramel)]">
              Painel admin
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">
              Pedidos recebidos
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Filtre os pedidos, acompanhe o status, edite dados de retirada ou entrega e confira os totais vendidos.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-[rgba(184,90,18,0.18)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-caramel)] transition hover:bg-[var(--color-cream)]"
          >
            Sair do painel
          </button>
        </header>

        {(feedback || error) && (
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
              error ? "bg-[#fff0eb] text-[#8f3f00]" : "bg-[#edf8ef] text-[#22663b]"
            }`}
          >
            {error || feedback}
          </div>
        )}

        <section className="mb-6 grid gap-4 rounded-[32px] border border-[rgba(184,90,18,0.1)] bg-white p-6 shadow-[0_20px_50px_rgba(140,58,18,0.08)] md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Filtros
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "todos" | OrderStatus)}
                  className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                >
                  <option value="todos">Todos</option>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                Data da retirada
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[24px] bg-[var(--color-cream)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Pedidos filtrados
            </p>
            <p className="mt-3 text-3xl font-bold text-[var(--color-syrup)]">{filteredOrders.length}</p>
          </div>

          <div className="rounded-[24px] bg-[var(--color-cream)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Faturamento filtrado
            </p>
            <p className="mt-3 text-3xl font-bold text-[var(--color-syrup)]">
              {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0))}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-[32px] border border-[rgba(184,90,18,0.1)] bg-white p-6 shadow-[0_20px_50px_rgba(140,58,18,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-caramel)]">
                Totais por produto
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Resumo de vendas</h2>
            </div>
          </div>

          {productSales.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {productSales.map((item) => (
                <article
                  key={item.productName}
                  className="rounded-[24px] bg-[linear-gradient(180deg,var(--color-cream)_0%,#fff2e7_100%)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{item.productName}</p>
                  <p className="mt-3 text-3xl font-bold text-[var(--color-syrup)]">{item.quantitySold}</p>
                  <p className="text-sm text-[var(--color-muted)]">unidades vendidas</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-caramel)]">
                    {formatCurrency(item.totalRevenue)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {filteredOrders.length === 0 ? (
          <div className="rounded-[32px] border border-[rgba(184,90,18,0.1)] bg-white p-10 text-center shadow-[0_20px_50px_rgba(140,58,18,0.08)]">
            <h2 className="text-2xl font-semibold">Nenhum pedido encontrado</h2>
            <p className="mt-3 text-[var(--color-muted)]">
              Ajuste os filtros ou aguarde novos pedidos aparecerem aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order) => {
              const isEditing = editingOrderId === order.id && editingForm;

              return (
                <article
                  key={order.id}
                  className="rounded-[32px] border border-[rgba(184,90,18,0.1)] bg-white p-6 shadow-[0_20px_50px_rgba(140,58,18,0.08)]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-2xl font-semibold">Pedido #{order.id}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${statusStyles[order.status]}`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                            fulfillmentStyles[order.fulfillmentMethod] ||
                            "bg-[var(--color-plate)] text-[var(--color-syrup)]"
                          }`}
                        >
                          {order.fulfillmentMethod}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                            Cliente
                            <input
                              value={editingForm.customerName}
                              onChange={(event) =>
                                setEditingForm((current) =>
                                  current
                                    ? { ...current, customerName: event.target.value }
                                    : current
                                )
                              }
                              className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                            />
                          </label>
                          <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                            WhatsApp
                            <input
                              value={editingForm.whatsapp}
                              onChange={(event) =>
                                setEditingForm((current) =>
                                  current ? { ...current, whatsapp: event.target.value } : current
                                )
                              }
                              className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                            />
                          </label>
                          <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                            Forma de recebimento
                            <select
                              value={editingForm.fulfillmentMethod}
                              onChange={(event) =>
                                setEditingForm((current) =>
                                  current
                                    ? event.target.value === "retirada"
                                      ? {
                                          ...current,
                                          fulfillmentMethod: event.target.value,
                                          deliveryAddress: "",
                                          deliveryNeighborhood: "",
                                          deliveryReference: "",
                                        }
                                      : { ...current, fulfillmentMethod: event.target.value }
                                    : current
                                )
                              }
                              className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                            >
                              <option value="retirada">Retirada</option>
                              <option value="entrega">Entrega</option>
                            </select>
                          </label>
                          <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                            Data do pedido
                            <input
                              type="date"
                              value={editingForm.pickupDate}
                              onChange={(event) =>
                                setEditingForm((current) =>
                                  current ? { ...current, pickupDate: event.target.value } : current
                                )
                              }
                              className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                            />
                          </label>
                          <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                            Horario desejado
                            <input
                              type="time"
                              value={editingForm.pickupTime}
                              onChange={(event) =>
                                setEditingForm((current) =>
                                  current ? { ...current, pickupTime: event.target.value } : current
                                )
                              }
                              className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                            />
                          </label>
                          {editingForm.fulfillmentMethod === "entrega" && (
                            <>
                              <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)] sm:col-span-2">
                                Endereco de entrega
                                <input
                                  value={editingForm.deliveryAddress}
                                  onChange={(event) =>
                                    setEditingForm((current) =>
                                      current
                                        ? {
                                            ...current,
                                            deliveryAddress: event.target.value,
                                          }
                                        : current
                                    )
                                  }
                                  className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                                />
                              </label>
                              <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                                Bairro
                                <input
                                  value={editingForm.deliveryNeighborhood}
                                  onChange={(event) =>
                                    setEditingForm((current) =>
                                      current
                                        ? {
                                            ...current,
                                            deliveryNeighborhood: event.target.value,
                                          }
                                        : current
                                    )
                                  }
                                  className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                                />
                              </label>
                              <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)]">
                                Ponto de referencia
                                <input
                                  value={editingForm.deliveryReference}
                                  onChange={(event) =>
                                    setEditingForm((current) =>
                                      current
                                        ? {
                                            ...current,
                                            deliveryReference: event.target.value,
                                          }
                                        : current
                                    )
                                  }
                                  className="rounded-2xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                                />
                              </label>
                            </>
                          )}
                          <label className="grid gap-2 text-sm font-medium text-[var(--color-muted)] sm:col-span-2">
                            Observacoes
                            <textarea
                              rows={3}
                              value={editingForm.notes}
                              onChange={(event) =>
                                setEditingForm((current) =>
                                  current ? { ...current, notes: event.target.value } : current
                                )
                              }
                              className="rounded-3xl border border-[rgba(184,90,18,0.14)] bg-[var(--color-cream)] px-4 py-3 text-[var(--color-ink)] outline-none"
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-2 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                            <p>
                              <strong className="text-[var(--color-ink)]">Cliente:</strong> {order.customerName}
                            </p>
                            <p>
                              <strong className="text-[var(--color-ink)]">WhatsApp:</strong> {order.whatsapp}
                            </p>
                            <p>
                              <strong className="text-[var(--color-ink)]">Recebimento:</strong>{" "}
                              {order.fulfillmentMethod === "entrega" ? "Entrega" : "Retirada"}
                            </p>
                            <p>
                              <strong className="text-[var(--color-ink)]">Data e horario:</strong> {order.pickupDate} as{" "}
                              {order.pickupTime}
                            </p>
                            {order.fulfillmentMethod === "entrega" && (
                              <>
                                <p>
                                  <strong className="text-[var(--color-ink)]">Endereco:</strong>{" "}
                                  {order.deliveryAddress}
                                </p>
                                <p>
                                  <strong className="text-[var(--color-ink)]">Bairro:</strong>{" "}
                                  {order.deliveryNeighborhood}
                                </p>
                              </>
                            )}
                            <p>
                              <strong className="text-[var(--color-ink)]">Criado em:</strong> {order.createdAt}
                            </p>
                          </div>
                          {order.fulfillmentMethod === "entrega" && order.deliveryReference && (
                            <p className="rounded-2xl bg-[var(--color-cream)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
                              <strong className="text-[var(--color-ink)]">Referencia:</strong>{" "}
                              {order.deliveryReference}
                            </p>
                          )}
                          {order.notes && (
                            <p className="rounded-2xl bg-[var(--color-cream)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
                              <strong className="text-[var(--color-ink)]">Observacoes:</strong> {order.notes}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="min-w-[240px] rounded-[24px] bg-[var(--color-cream)] p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Acoes do pedido
                      </p>
                      <div className="mt-3 grid gap-2">
                        {orderStatuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={pendingOrderId === order.id || status === order.status}
                            onClick={() => updateStatus(order.id, status)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              status === order.status
                                ? `${statusStyles[status]} cursor-default`
                                : "border border-[rgba(184,90,18,0.18)] bg-white text-[var(--color-caramel)] hover:bg-white/70"
                            } disabled:cursor-not-allowed disabled:opacity-70`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              disabled={pendingOrderId === order.id}
                              onClick={() => saveEdit(order)}
                              className="rounded-full bg-[var(--color-caramel)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-caramel-dark)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Salvar edicao
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="rounded-full border border-[rgba(184,90,18,0.18)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-caramel)] transition hover:bg-white/70"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing(order)}
                            className="rounded-full border border-[rgba(184,90,18,0.18)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-caramel)] transition hover:bg-white/70"
                          >
                            Editar pedido
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={pendingOrderId === order.id}
                          onClick={() => removeOrder(order.id)}
                          className="rounded-full bg-[#8f3f00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#733200] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Excluir pedido
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-[rgba(184,90,18,0.1)] bg-[linear-gradient(180deg,var(--color-cream)_0%,#fff2e7_100%)] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Itens do pedido
                      </p>
                      <strong className="text-[var(--color-syrup)]">
                        Total {formatCurrency(order.totalAmount)}
                      </strong>
                    </div>
                    <div className="grid gap-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 rounded-[20px] bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[var(--color-ink)]">{item.productName}</p>
                            <p className="text-[var(--color-muted)]">
                              {item.quantity}x {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <strong className="text-[var(--color-syrup)]">
                            {formatCurrency(item.lineTotal)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
