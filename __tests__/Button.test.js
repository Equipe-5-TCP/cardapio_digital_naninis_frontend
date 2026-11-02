import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../App';

describe('<Button />', () => {
  it('chama onPress ao ser tocado', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Confirmar pedido" onPress={onPress} />);
    fireEvent.press(getByText('Confirmar pedido'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não chama onPress quando está desabilitado', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Confirmar pedido" onPress={onPress} disabled />);
    fireEvent.press(getByText('Confirmar pedido'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('expõe um rótulo de acessibilidade específico, quando informado', () => {
    const { getByLabelText } = render(
      <Button label="Adicionar" a11yLabel="Adicionar Cappuccino ao carrinho" onPress={() => {}} />
    );
    expect(getByLabelText('Adicionar Cappuccino ao carrinho')).toBeTruthy();
  });
});
