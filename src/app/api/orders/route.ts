import { NextResponse } from "next/server";
import { createOrder, type OrderInput } from "@/lib/db";

type IncomingItem = {
  productName?: unknown;
  unitPrice?: unknown;
  quantity?: unknown;
};

type IncomingBody = {
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingBody;
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
        { error: "Preencha nome, WhatsApp, forma de recebimento, data, horario e adicione itens ao pedido." },
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

    const order = createOrder({
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

    return NextResponse.json(
      {
        message: "Pedido salvo com sucesso.",
        orderId: order.id,
        totalAmount: order.totalAmount,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel salvar o pedido agora. Tente novamente." },
      { status: 500 }
    );
  }
}
