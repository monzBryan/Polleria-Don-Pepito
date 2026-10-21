import { esDobleEspacio, filtroPorTecla } from './orders.page';

describe('Atajos por teclado · Pedidos', () => {
  describe('filtroPorTecla', () => {
    it('tecla 1 activa el filtro Todos', () => {
      expect(filtroPorTecla('1')).toBe('todos');
    });

    it('tecla 2 activa el filtro Pendiente', () => {
      expect(filtroPorTecla('2')).toBe('pendiente');
    });

    it('tecla 3 activa el filtro Confirmado', () => {
      expect(filtroPorTecla('3')).toBe('confirmado');
    });

    it('tecla 4 activa el filtro En preparación', () => {
      expect(filtroPorTecla('4')).toBe('en_preparacion');
    });

    it('tecla 5 activa el filtro En camino', () => {
      expect(filtroPorTecla('5')).toBe('en_camino');
    });

    it('tecla 6 activa el filtro Listo para recoger', () => {
      expect(filtroPorTecla('6')).toBe('listo');
    });

    it('tecla 7 activa el filtro Entregado', () => {
      expect(filtroPorTecla('7')).toBe('entregado');
    });

    it('tecla 8 activa el filtro Cancelado', () => {
      expect(filtroPorTecla('8')).toBe('cancelado');
    });

    it('teclas fuera de rango no cambian el filtro', () => {
      expect(filtroPorTecla('0')).toBeNull();
      expect(filtroPorTecla('9')).toBeNull();
    });

    it('teclas no numéricas no cambian el filtro', () => {
      expect(filtroPorTecla('a')).toBeNull();
      expect(filtroPorTecla('')).toBeNull();
      expect(filtroPorTecla('F1')).toBeNull();
    });
  });

  describe('esDobleEspacio', () => {
    it('una sola pulsación no lo considera doble espacio', () => {
      expect(esDobleEspacio(0, 1_000)).toBe(false);
    });

    it('dos pulsaciones seguidas (menos de 400 ms) lo considera doble espacio', () => {
      expect(esDobleEspacio(1_000, 1_350)).toBe(true);
    });

    it('dos pulsaciones separadas por más de 400 ms no cuentan', () => {
      expect(esDobleEspacio(1_000, 1_450)).toBe(false);
    });
  });
});
