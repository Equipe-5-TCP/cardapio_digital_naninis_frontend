import { getCartSummary, canSubmitOrder } from '../App';

const products = [
  { id: 1, name: 'Café Coado', price: 8.5 },
  { id: 2, name: 'Pão de Queijo', price: 9.9 },
];

describe('getCartSummary', () => {
  it('soma o total e a quantidade de itens no carrinho', () => {
    const cart = { 1: 2, 2: 1 };
    const { total, count, lines } = getCartSummary(products, cart);
    expect(count).toBe(3);
    expect(total).toBeCloseTo(8.5 * 2 + 9.9);
    expect(lines).toHaveLength(2);
  });

  it('retorna vazio quando não há itens selecionados', () => {
    const { total, count, lines } = getCartSummary(products, {});
    expect(total).toBe(0);
    expect(count).toBe(0);
    expect(lines).toHaveLength(0);
  });

  it('ignora produtos com quantidade zero no carrinho', () => {
    const { count, lines } = getCartSummary(products, { 1: 0, 2: 2 });
    expect(count).toBe(2);
    expect(lines).toHaveLength(1);
  });
});

describe('canSubmitOrder', () => {
  const baseForm = { name: 'Maria', type: 'local', table: '5' };

  it('permite enviar "comer aqui" com nome, mesa e itens', () => {
    expect(canSubmitOrder(baseForm, 2)).toBe(true);
  });

  it('bloqueia "comer aqui" sem número da mesa', () => {
    expect(canSubmitOrder({ ...baseForm, table: '' }, 2)).toBe(false);
  });

  it('não exige mesa quando o tipo é "para levar"', () => {
    expect(canSubmitOrder({ ...baseForm, type: 'viagem', table: '' }, 2)).toBe(true);
  });

  it('bloqueia quando o carrinho está vazio', () => {
    expect(canSubmitOrder(baseForm, 0)).toBe(false);
  });

  it('bloqueia quando o nome está em branco ou só com espaços', () => {
    expect(canSubmitOrder({ ...baseForm, name: '   ' }, 2)).toBe(false);
  });
});
