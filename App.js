import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Image, ScrollView, TextInput, Pressable, ActivityIndicator,
  useWindowDimensions, Platform, StyleSheet, SafeAreaView,
} from 'react-native';
import { C, money } from './src/theme';
import { getMenu, createOrder, getStatus } from './src/api';

// O QR code de cada mesa aponta para: https://SEU-SITE/?mesa=5
const mesaDoQR = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('mesa') || '';
};

const STEPS = [
  ['recebido', 'Pedido recebido'],
  ['preparando', 'Preparando'],
  ['pronto', 'Pronto!'],
];

// Funções puras (sem dependência de UI), pensadas para serem testadas isoladamente.
export function getCartSummary(products, cart) {
  const lines = products.filter((p) => cart[p.id]);
  const total = lines.reduce((t, p) => t + p.price * cart[p.id], 0);
  const count = lines.reduce((t, p) => t + cart[p.id], 0);
  return { lines, total, count };
}

export function canSubmitOrder(form, count) {
  return Boolean(form.name.trim()) && (form.type === 'viagem' || Boolean(form.table.trim())) && count > 0;
}

export function Button({ label, onPress, disabled, light, a11yLabel }) {
  return (
    <Pressable onPress={onPress} disabled={disabled}
      accessibilityRole="button" accessibilityLabel={a11yLabel || label}
      accessibilityState={{ disabled: !!disabled }} hitSlop={8}
      style={[s.btn, light && s.btnLight, disabled && { opacity: 0.4 }]}>
      <Text style={[s.btnText, light && { color: C.brown }]}>{label}</Text>
    </Pressable>
  );
}

export function Header({ title, onBack }) {
  return (
    <View style={s.header}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Voltar para o cardápio" hitSlop={10}>
          <Text style={s.back}>‹ Voltar</Text>
        </Pressable>
      ) : null}
      <Text style={s.logo}>{title}</Text>
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const cols = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const [screen, setScreen] = useState('menu'); // menu | checkout | tracking
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [cat, setCat] = useState(null);
  const [cart, setCart] = useState({}); // { productId: quantidade }
  const [form, setForm] = useState({ name: '', type: 'local', table: mesaDoQR(), phone: '', notes: '' });
  const [order, setOrder] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getMenu().then((m) => { setMenu(m); setCat(m[0]?.id ?? null); }).catch((e) => setError(e.message));
  }, []);

  const products = useMemo(() => (menu || []).flatMap((c) => c.products), [menu]);
  const { lines, total, count } = getCartSummary(products, cart);
  const setQty = (id, d) => setCart((c) => {
    const q = Math.max(0, (c[id] || 0) + d);
    const n = { ...c }; q ? (n[id] = q) : delete n[id]; return n;
  });

  // Acompanhamento: consulta o status a cada 5 s
  useEffect(() => {
    if (screen !== 'tracking' || !order) return;
    const t = setInterval(() => getStatus(order.id).then((r) => setOrder((o) => ({ ...o, status: r.status }))).catch(() => {}), 5000);
    return () => clearInterval(t);
  }, [screen, order?.id]);

  const send = async () => {
    setSending(true); setError('');
    try {
      const r = await createOrder({
        customer_name: form.name.trim(), order_type: form.type,
        table_number: form.table.trim(), phone: form.phone.trim(), notes: form.notes.trim(),
        items: lines.map((p) => ({ product_id: p.id, quantity: cart[p.id] })),
      });
      setOrder(r); setCart({}); setScreen('tracking');
    } catch (e) { setError(e.message); }
    setSending(false);
  };

  const canSend = canSubmitOrder(form, count);

  // ---------- Acompanhamento ----------
  if (screen === 'tracking' && order) {
    const idx = STEPS.findIndex(([k]) => k === order.status);
    return (
      <SafeAreaView style={s.page}>
        <Header title="Nanini's Café" />
        <View style={s.wrap}>
          <Text style={s.h1}>Pedido #{order.id}</Text>
          <Text style={s.muted}>Total: {money(order.total)}</Text>
          {order.status === 'cancelado' ? <Text style={s.h2} accessibilityLiveRegion="polite">Pedido cancelado.</Text> :
            STEPS.map(([k, label], i) => {
              const state = i < idx ? 'concluído' : i === idx ? 'etapa atual' : 'ainda não iniciado';
              return (
                <View key={k} style={s.step} accessible accessibilityLabel={`${label}, ${state}`}
                  accessibilityLiveRegion={i === idx ? 'polite' : 'none'}>
                  <View style={[s.dot, i <= idx && { backgroundColor: C.brown }]} />
                  <Text style={[s.stepText, i === idx && { fontWeight: '800' }, i > idx && { color: C.muted }]}>{label}</Text>
                </View>
              );
            })}
          {order.status === 'pronto' && (
            <Text style={s.h2}>{form.type === 'local' ? 'Seu pedido já vai até a mesa!' : 'Retire no balcão. Bom café!'}</Text>
          )}
          <Button light label="Fazer novo pedido" onPress={() => { setOrder(null); setScreen('menu'); }} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Finalizar ----------
  if (screen === 'checkout') {
    return (
      <SafeAreaView style={s.page}>
        <Header title="Finalizar pedido" onBack={() => setScreen('menu')} />
        <ScrollView contentContainerStyle={s.wrap}>
          {lines.map((p) => (
            <View key={p.id} style={s.row}>
              <Text style={s.rowName}>{cart[p.id]}× {p.name}</Text>
              <Text style={s.rowName}>{money(p.price * cart[p.id])}</Text>
            </View>
          ))}
          <View style={s.row}><Text style={s.h2}>Total</Text><Text style={s.h2}>{money(total)}</Text></View>

          <Text style={s.label} nativeID="lbl-nome">Seu nome</Text>
          <TextInput style={s.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="Como podemos te chamar?" accessibilityLabel="Seu nome" accessibilityLabelledBy="lbl-nome" />

          <Text style={s.label}>Como vai ser?</Text>
          <View style={s.toggle} accessibilityRole="radiogroup">
            {[['local', 'Comer aqui'], ['viagem', 'Para levar']].map(([k, l]) => (
              <Pressable key={k} onPress={() => setForm({ ...form, type: k })}
                accessibilityRole="radio" accessibilityLabel={l} accessibilityState={{ selected: form.type === k }}
                style={[s.tog, form.type === k && s.togOn]}>
                <Text style={[s.togText, form.type === k && { color: C.yellow }]}>{l}</Text>
              </Pressable>
            ))}
          </View>

          {form.type === 'local' ? (
            <>
              <Text style={s.label}>Número da mesa</Text>
              <TextInput style={s.input} value={form.table} keyboardType="number-pad"
                onChangeText={(v) => setForm({ ...form, table: v })} placeholder="Ex.: 5"
                accessibilityLabel="Número da mesa" />
            </>
          ) : (
            <>
              <Text style={s.label}>Telefone (opcional, para avisarmos)</Text>
              <TextInput style={s.input} value={form.phone} keyboardType="phone-pad"
                onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="(11) 90000-0000" />
            </>
          )}

          <Text style={s.label}>Observações</Text>
          <TextInput style={[s.input, { height: 80 }]} multiline value={form.notes}
            onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Ex.: sem açúcar, pouco gelo…" />

          {error ? <Text style={s.error}>{error}</Text> : null}
          <Button label={sending ? 'Enviando…' : 'Confirmar pedido'} onPress={send} disabled={!canSend || sending} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Cardápio ----------
  const visible = (menu || []).find((c) => c.id === cat)?.products || [];
  return (
    <SafeAreaView style={s.page}>
      <Header title="Nanini's Café" />
      {!menu && !error && <ActivityIndicator style={{ marginTop: 40 }} color={C.brown} />}
      {error ? <Text style={s.error}>{error}</Text> : null}
      {menu && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={{ paddingHorizontal: 12 }}
            accessibilityRole="tablist">
            {menu.map((c) => (
              <Pressable key={c.id} onPress={() => setCat(c.id)} style={[s.chip, cat === c.id && s.chipOn]}
                accessibilityRole="tab" accessibilityLabel={`Categoria ${c.name}`} accessibilityState={{ selected: cat === c.id }}>
                <Text style={[s.chipText, cat === c.id && { color: C.yellow }]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView contentContainerStyle={[s.grid, { paddingBottom: 110 }]}>
            {visible.length === 0 && <Text style={s.muted}>Nada por aqui ainda.</Text>}
            {visible.map((p) => (
              <View key={p.id} style={[s.card, { width: `${100 / cols - 2}%` }]}>
                {p.image_url ? <Image source={{ uri: p.image_url }} style={s.img} accessible={false} importantForAccessibility="no" />
                  : <View style={[s.img, { backgroundColor: C.yellow }]} />}
                <View style={{ padding: 12 }}>
                  <Text style={s.name}>{p.name}</Text>
                  {p.description ? <Text style={s.muted} numberOfLines={3}>{p.description}</Text> : null}
                  <View style={s.priceRow}>
                    <Text style={s.price}>{money(p.price)}</Text>
                    {cart[p.id] ? (
                      <View style={s.stepper} accessible accessibilityLabel={`${cart[p.id]} unidades de ${p.name} no carrinho`}>
                        <Pressable onPress={() => setQty(p.id, -1)} style={s.sb} hitSlop={10}
                          accessibilityRole="button" accessibilityLabel={`Diminuir quantidade de ${p.name}`}>
                          <Text style={s.sbt}>−</Text>
                        </Pressable>
                        <Text style={s.qty}>{cart[p.id]}</Text>
                        <Pressable onPress={() => setQty(p.id, 1)} style={s.sb} hitSlop={10}
                          accessibilityRole="button" accessibilityLabel={`Aumentar quantidade de ${p.name}`}>
                          <Text style={s.sbt}>+</Text>
                        </Pressable>
                      </View>
                    ) : <Button light label="Adicionar" a11yLabel={`Adicionar ${p.name} ao carrinho`} onPress={() => setQty(p.id, 1)} />}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}
      {count > 0 && (
        <View style={s.bar}>
          <Button label={`Ver pedido • ${count} ${count > 1 ? 'itens' : 'item'} • ${money(total)}`} onPress={() => setScreen('checkout')} />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.yellow, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', borderBottomWidth: 2, borderColor: C.brown },
  logo: { color: C.brown, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  back: { color: C.brown, fontWeight: '700', position: 'absolute', left: 0, top: -2 },
  wrap: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, gap: 8 },
  h1: { fontSize: 28, fontWeight: '900', color: C.brown },
  h2: { fontSize: 18, fontWeight: '800', color: C.brown, marginVertical: 8 },
  muted: { color: C.muted, fontSize: 14 },
  label: { color: C.brown, fontWeight: '700', marginTop: 14, marginBottom: 4 },
  input: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12, fontSize: 16 },
  error: { color: '#B3261E', textAlign: 'center', margin: 12 },
  btn: { backgroundColor: C.brown, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', marginTop: 12 },
  btnLight: { backgroundColor: C.yellow, marginTop: 0, paddingVertical: 8 },
  btnText: { color: C.yellow, fontWeight: '800', fontSize: 16 },
  tabs: { flexGrow: 0, paddingVertical: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, marginRight: 8 },
  chipOn: { backgroundColor: C.brown, borderColor: C.brown },
  chipText: { color: C.brown, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 16, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  card: { backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  img: { width: '100%', height: 150 },
  name: { fontSize: 17, fontWeight: '800', color: C.brown, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { fontSize: 18, fontWeight: '900', color: C.brown },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.yellow, borderRadius: 10 },
  sb: { paddingHorizontal: 14, paddingVertical: 6 }, sbt: { fontSize: 20, fontWeight: '900', color: C.brown },
  qty: { fontWeight: '800', color: C.brown, minWidth: 20, textAlign: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: C.cream, borderTopWidth: 1, borderColor: C.line, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowName: { color: C.brown, fontSize: 15 },
  toggle: { flexDirection: 'row', gap: 10 },
  tog: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.brown, alignItems: 'center' },
  togOn: { backgroundColor: C.brown }, togText: { color: C.brown, fontWeight: '800' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.line },
  stepText: { fontSize: 18, color: C.brown },
});
