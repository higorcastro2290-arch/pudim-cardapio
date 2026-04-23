import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  deleteOrder,
  getProductSalesSummary,
  listOrders,
  orderStatuses,
  updateOrder,
  updateOrderStatus,
  type OrderInput,
  type OrderStatus,
} from "@/lib/db";

type IncomingItem = {
  productName?: unknown;
  unitPrice?: unknown;
  quantity?: unknown;
};

function isValidStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && orderStatuses.includes(value as OrderStatus);
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeItems(items: unknown): OrderInput["items"] | null {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const normalized = items
    .map((item) => item as IncomingItem)
    .filter(
      (item) =>
        isNonEmptyString(item.productName) &&
        typeof item.unitPrice === "number" &&
        Number.isFinite(item.unitPrice) &&
        item.unitPrice >= 0 &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    )
    .map((item) => ({
      productName: String(item.productName).trim(),
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
    }));

  return normalized.length > 0 ? normalized : null;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  return NextResponse.json({
    orders: listOrders(),
    productSales: getProductSalesSummary(),
  });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      mode?: unknown;
      orderId?: unknown;
      status?: unknown;
      customerName?: unknown;
      whatsapp?: unknown;
      fulfillmentMethod?: unknown;
      deliveryAddress?: unknown;
      deliveryNeighborhood?: unknown;
      deliveryReference?: unknown;
      pickupDate?: unknown;
      pickupTime?: unknown;
      notes?: unknown;
      items?: unknown;
    };

    const orderId = typeof body.orderId === "number" ? body.orderId : Number(body.orderId);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Informe um pedido valido." }, { status: 400 });
    }

    if (body.mode === "edit") {
      const items = sanitizeItems(body.items);

      if (
        !isNonEmptyString(body.customerName) ||
        !isNonEmptyString(body.whatsapp) ||
        !isNonEmptyString(body.fulfillmentMethod) ||
        !isNonEmptyString(body.pickupDate) ||
        !isNonEmptyString(body.pickupTime) ||
        !items
      ) {
        return NextResponse.json(
          { error: "Preencha nome, WhatsApp, forma de recebimento, data, horario e itens para editar o pedido." },
          { status: 400 }
        );
      }

      const fulfillmentMethod = String(body.fulfillmentMethod).trim();
      const deliveryAddress =
        fulfillmentMethod === "entrega" && typeof body.deliveryAddress === "string"
          ? body.deliveryAddress.trim()
          : "";
      const deliveryNeighborhood =
        fulfillmentMethod === "entrega" && typeof body.deliveryNeighborhood === "string"
          ? body.deliveryNeighborhood.trim()
          : "";
      const deliveryReference =
        fulfillmentMethod === "entrega" && typeof body.deliveryReference === "string"
          ? body.deliveryReference.trim()
          : "";

      if (
        fulfillmentMethod === "entrega" &&
        (!deliveryAddress || !deliveryNeighborhood)
      ) {
        return NextResponse.json(
          { error: "Para entrega, preencha endereco e bairro." },
          { status: 400 }
        );
      }

      const order = updateOrder(orderId, {
        customerName: String(body.customerName).trim(),
        whatsapp: String(body.whatsapp).trim(),
        fulfillmentMethod,
        deliveryAddress,
        deliveryNeighborhood,
        deliveryReference,
        pickupDate: String(body.pickupDate).trim(),
        pickupTime: String(body.pickupTime).trim(),
        notes: typeof body.notes === "string" ? body.notes.trim() : "",
        items,
      });

      if (!order) {
        return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
      }

      return NextResponse.json({ message: "Pedido atualizado com sucesso.", order });
    }

    if (!isValidStatus(body.status)) {
      return NextResponse.json(
        { error: "Informe um status permitido para o pedido." },
        { status: 400 }
      );
    }

    const order = updateOrderStatus(orderId, body.status);

    if (!order) {
      return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Status atualizado com sucesso.", order });
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel atualizar o pedido." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderId = Number(searchParams.get("orderId"));

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Informe um pedido valido." }, { status: 400 });
    }

    deleteOrder(orderId);
    return NextResponse.json({ message: "Pedido excluido com sucesso." });
  } catch {
    return NextResponse.json({ error: "Nao foi possivel excluir o pedido." }, { status: 500 });
  }
}
