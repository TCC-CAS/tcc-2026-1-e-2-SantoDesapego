import { Link, useLocation } from "react-router-dom";
import "./CompraRealizada.css";

export default function CompraRealizada() {
  // O anúncio comprado chega pelo navigate("/compra-realizada", { state: { anuncio } })
  const { state } = useLocation();
  const anuncio = state?.anuncio;

  const brl = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Se veio de um anúncio, monta o pedido com ele; senão, usa o exemplo abaixo.
  const pedido = anuncio
    ? {
        codigo: `SD-${String(anuncio.id).padStart(4, "0")}`,
        email: "voce@email.com",
        pagamento: "Pix · aprovado",
        retirada: anuncio.bairro,
        itens: [
          {
            id: anuncio.id,
            nome: anuncio.titulo,
            vendedor: anuncio.vendedor?.nome ?? "Vendedor",
            preco: brl(anuncio.preco),
          },
        ],
        subtotal: brl(anuncio.preco),
        frete: "Retirada gratuita",
        total: brl(anuncio.preco),
      }
    : {
        codigo: "SD-2418",
        email: "voce@email.com",
        pagamento: "Pix · aprovado",
        retirada: "Rua Promissão, 84 — Santo Amaro, São Paulo",
        itens: [
          { id: 1, nome: "Cadeira de palhinha anos 70", vendedor: "Ateliê da Dona Zi", preco: "R$ 180,00" },
          { id: 2, nome: "Luminária de mesa em latão", vendedor: "Brechó Pontual", preco: "R$ 95,00" },
        ],
        subtotal: "R$ 275,00",
        frete: "Retirada gratuita",
        total: "R$ 275,00",
      };

  const etapas = [
    { n: "01", titulo: "Pedido confirmado", texto: "Pagamento aprovado agora há pouco. O comprovante foi para o seu e-mail." },
    { n: "02", titulo: "Separação", texto: "O vendedor embala a peça e confirma o horário de retirada em até 1 dia útil." },
    { n: "03", titulo: "Retirada", texto: "Você recebe um aviso quando a peça estiver pronta no ponto de encontro." },
    { n: "04", titulo: "Nova casa", texto: "Conte pra gente como ficou. A história da peça continua com você." },
  ];

  return (
    <main className="compra">
      <section className="compra-hero">
        <span className="compra-hero__marca" aria-hidden="true">ACHOU</span>
        <p className="compra-hero__selo">Pedido {pedido.codigo}</p>
        <h1 className="compra-hero__titulo">
          Compra realizada.<br />
          A peça <em>achou</em> uma nova casa.
        </h1>
        <p className="compra-hero__texto">
          Enviamos a confirmação para <strong>{pedido.email}</strong>. Guarde o código do pedido:
          é ele que identifica você na hora da retirada.
        </p>

        <div className="compra-hero__acoes">
          <Link className="btn btn--solido" to="/explorar">Continuar garimpando</Link>
          <Link className="btn btn--vazado" to="/perfil">Ver meus pedidos</Link>
        </div>
      </section>

      <section className="compra-resumo">
        <h2 className="compra-titulo">O que você levou</h2>

        <ul className="resumo-lista">
          {pedido.itens.map((item) => (
            <li className="resumo-item" key={item.id}>
              <div className="resumo-item__info">
                <h3>{item.nome}</h3>
                <p>{item.vendedor} · peça única</p>
              </div>
              <span className="resumo-item__preco">{item.preco}</span>
            </li>
          ))}
        </ul>

        <dl className="resumo-conta">
          <div><dt>Subtotal</dt><dd>{pedido.subtotal}</dd></div>
          <div><dt>Frete</dt><dd>{pedido.frete}</dd></div>
          <div className="resumo-conta__total"><dt>Total</dt><dd>{pedido.total}</dd></div>
        </dl>

        <div className="resumo-meta">
          <p><span>Pagamento</span>{pedido.pagamento}</p>
          <p><span>Retirada</span>{pedido.retirada}</p>
        </div>
      </section>

      <section className="compra-etapas">
        <h2 className="compra-titulo">O que acontece agora</h2>
        <ol className="etapas">
          {etapas.map((etapa, i) => (
            <li className={`etapa${i === 0 ? " etapa--ativa" : ""}`} key={etapa.n}>
              <span className="etapa__n" aria-hidden="true">{etapa.n}</span>
              <h3 className="etapa__titulo">{etapa.titulo}</h3>
              <p className="etapa__texto">{etapa.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="compra-ajuda">
        <h2>Precisa mudar alguma coisa?</h2>
        <p>
          Dá para alterar o ponto de retirada ou cancelar o pedido enquanto ele estiver na etapa de
          separação. Depois disso, fale direto com o vendedor pelo chat do pedido.
        </p>
        <Link className="btn btn--creme" to="/sobre">Falar com o suporte</Link>
      </section>
    </main>
  );
}