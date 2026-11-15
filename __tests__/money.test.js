import { money } from '../src/theme';

describe('money', () => {
  it('formata em reais com vírgula decimal', () => {
    expect(money(8.5)).toBe('R$ 8,50');
    expect(money(22)).toBe('R$ 22,00');
  });

  it('arredonda para duas casas decimais', () => {
    expect(money(8.555)).toBe('R$ 8,56');
  });

  it('lida com zero', () => {
    expect(money(0)).toBe('R$ 0,00');
  });
});
