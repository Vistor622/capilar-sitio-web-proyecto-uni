/* =====================================================
   CAPILAR HEALTH — lógica simulada de tienda
   Todo funciona 100% en el navegador (localStorage).
   No hay pagos reales ni backend: es una demostración
   de flujo de compra para el proyecto.
   ===================================================== */

(function () {
    "use strict";

    const CLAVE_METODO = "capilarhealth_metodo_pago";
    const CLAVE_PEDIDO = "capilarhealth_ultimo_pedido";

    const overlay = document.getElementById("modal-overlay");
    const modalContenido = document.getElementById("modal-contenido");
    const btnCerrarModal = document.getElementById("modal-cerrar");
    const toast = document.getElementById("toast");

    const btnPago = document.getElementById("btn-pago");
    const btnReiniciar = document.getElementById("btn-reiniciar");
    const btnSeguimiento = document.getElementById("btn-seguimiento");
    const btnComprar = document.getElementById("btn-comprar");
    const badgePago = document.getElementById("badge-pago");

    const resumenTexto = document.getElementById("resumen-texto");
    const resumenTotal = document.getElementById("resumen-total");

    const METODOS = {
        tarjeta: "Tarjeta de crédito/débito",
        transferencia: "Transferencia bancaria",
        efectivo: "Efectivo en clínica"
    };

    /* ---------- utilidades ---------- */

    function formatoMoneda(numero) {
        return "$" + numero.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MXN";
    }

    function mostrarToast(mensaje) {
        if (!toast) return;
        toast.textContent = mensaje;
        toast.hidden = false;
        clearTimeout(mostrarToast._t);
        mostrarToast._t = setTimeout(() => { toast.hidden = true; }, 2600);
    }

    function abrirModal(html) {
        modalContenido.innerHTML = html;
        overlay.hidden = false;
        document.body.style.overflow = "hidden";
        const primerFoco = modalContenido.querySelector("button, input");
        if (primerFoco) primerFoco.focus();
    }

    function cerrarModal() {
        overlay.hidden = true;
        document.body.style.overflow = "";
    }

    if (btnCerrarModal) btnCerrarModal.addEventListener("click", cerrarModal);
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) cerrarModal();
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay && !overlay.hidden) cerrarModal();
    });

    /* ---------- carrito (leído directo del DOM) ---------- */

    function leerCarrito() {
        const items = [];
        let total = 0;
        document.querySelectorAll(".product-card").forEach((card) => {
            const nombre = card.querySelector(".product-name").textContent.trim();
            card.querySelectorAll(".size-option").forEach((opcion) => {
                const check = opcion.querySelector(".size-check");
                const qty = opcion.querySelector(".size-qty");
                if (check && check.checked) {
                    const cantidad = Math.max(1, parseInt(qty.value, 10) || 1);
                    const precioUnitario = parseFloat(qty.dataset.price) || 0;
                    const subtotal = cantidad * precioUnitario;
                    total += subtotal;
                    items.push({
                        producto: nombre,
                        talla: check.dataset.size || "",
                        cantidad,
                        precioUnitario,
                        subtotal
                    });
                }
            });
        });
        return { items, total };
    }

    function actualizarResumen() {
        if (!resumenTexto) return;
        const { items, total } = leerCarrito();
        if (items.length === 0) {
            resumenTexto.textContent = "Aún no has seleccionado ningún producto.";
            resumenTotal.textContent = "";
            return;
        }
        const piezas = items.reduce((s, i) => s + i.cantidad, 0);
        resumenTexto.textContent = `${piezas} producto(s) seleccionado(s)`;
        resumenTotal.textContent = "Total: " + formatoMoneda(total);
    }

    document.querySelectorAll(".size-check").forEach((check) => {
        const contenedor = check.closest(".size-option");
        const qty = contenedor.querySelector(".size-qty");
        check.addEventListener("change", () => {
            qty.disabled = !check.checked;
            if (check.checked) {
                qty.value = qty.value && parseInt(qty.value, 10) > 0 ? qty.value : 1;
            }
            actualizarResumen();
        });
    });

    document.querySelectorAll(".size-qty").forEach((qty) => {
        qty.addEventListener("input", () => {
            let valor = parseInt(qty.value, 10);
            if (isNaN(valor) || valor < 1) valor = 1;
            if (valor > 30) valor = 30;
            qty.value = valor;
            actualizarResumen();
        });
    });

    actualizarResumen();

    /* ---------- método de pago ---------- */

    function obtenerMetodoGuardado() {
        return localStorage.getItem(CLAVE_METODO);
    }

    function actualizarBadgePago() {
        const metodo = obtenerMetodoGuardado();
        if (badgePago) {
            if (metodo && METODOS[metodo]) {
                badgePago.hidden = false;
                badgePago.textContent = METODOS[metodo];
            } else {
                badgePago.hidden = true;
            }
        }
    }
    actualizarBadgePago();

    function plantillaMetodoPago() {
        const actual = obtenerMetodoGuardado();
        const opciones = Object.entries(METODOS).map(([clave, etiqueta]) => `
            <label class="metodo-opcion">
                <input type="radio" name="metodo-pago" value="${clave}" ${actual === clave ? "checked" : ""}>
                ${etiqueta}
            </label>
        `).join("");

        return `
            <h3>Elige tu método de pago</h3>
            <p>Este método se usará para simular tu compra. Puedes cambiarlo cuando quieras.</p>
            <div class="metodo-lista">${opciones}</div>
            <div class="modal-acciones">
                <button type="button" class="epic" id="confirmar-metodo">Guardar método de pago</button>
            </div>
        `;
    }

    if (btnPago) {
        btnPago.addEventListener("click", () => {
            abrirModal(plantillaMetodoPago());
            const confirmar = document.getElementById("confirmar-metodo");
            confirmar.addEventListener("click", () => {
                const seleccionado = modalContenido.querySelector('input[name="metodo-pago"]:checked');
                if (!seleccionado) {
                    mostrarToast("Selecciona un método de pago primero.");
                    return;
                }
                localStorage.setItem(CLAVE_METODO, seleccionado.value);
                actualizarBadgePago();
                cerrarModal();
                mostrarToast("Método de pago guardado: " + METODOS[seleccionado.value]);
            });
        });
    }

    /* ---------- reiniciar pedido ---------- */

    if (btnReiniciar) {
        btnReiniciar.addEventListener("click", () => {
            abrirModal(`
                <h3>¿Reiniciar tu pedido?</h3>
                <p>Se desmarcarán todos los productos y cantidades seleccionadas. Esto no afecta compras ya realizadas.</p>
                <div class="modal-acciones">
                    <button type="button" class="epic" id="confirmar-reinicio">Sí, reiniciar</button>
                    <button type="button" class="epic secundario" id="cancelar-reinicio">Cancelar</button>
                </div>
            `);
            document.getElementById("confirmar-reinicio").addEventListener("click", () => {
                document.querySelectorAll(".size-check").forEach((check) => {
                    check.checked = false;
                    const qty = check.closest(".size-option").querySelector(".size-qty");
                    qty.value = 1;
                    qty.disabled = true;
                });
                actualizarResumen();
                cerrarModal();
                mostrarToast("Tu pedido se reinició.");
            });
            document.getElementById("cancelar-reinicio").addEventListener("click", cerrarModal);
        });
    }

    /* ---------- hacer compra (pasarela de pago simulada) ---------- */

    function generarFolio() {
        return "CH-" + Math.floor(100000 + Math.random() * 900000);
    }

    function plantillaResumenCompra(carrito, metodo) {
        const filas = carrito.items.map((i) => `
            <li><span>${i.producto} (${i.talla}) x${i.cantidad}</span><span>${formatoMoneda(i.subtotal)}</span></li>
        `).join("");

        return `
            <h3>Confirma tu compra</h3>
            <ul class="compra-lista">${filas}</ul>
            <div class="compra-total"><span>Total</span><span>${formatoMoneda(carrito.total)}</span></div>
            <p>Método de pago: <strong>${METODOS[metodo]}</strong></p>
            <div class="modal-acciones">
                <button type="button" class="epic" id="confirmar-compra">Confirmar y pagar</button>
                <button type="button" class="epic secundario" id="cancelar-compra">Cancelar</button>
            </div>
        `;
    }

    function plantillaProcesando() {
        return `
            <h3 style="text-align:center;">Procesando tu pago…</h3>
            <div class="spinner"></div>
            <p style="text-align:center;">Estamos confirmando el pago con tu método seleccionado. Esto es una simulación, no se realiza ningún cobro real.</p>
        `;
    }

    function plantillaExito(pedido) {
        return `
            <h3>¡Compra realizada con éxito!</h3>
            <p>Tu número de pedido es <strong>${pedido.id}</strong>. Guárdalo para dar seguimiento a tu compra.</p>
            <div class="compra-total"><span>Total pagado</span><span>${formatoMoneda(pedido.total)}</span></div>
            <p>Método de pago: <strong>${METODOS[pedido.metodo]}</strong><br>
            Entrega estimada: <strong>${pedido.entrega}</strong></p>
            <div class="modal-acciones">
                <button type="button" class="epic" id="ver-seguimiento">Ver seguimiento del pedido</button>
                <button type="button" class="epic secundario" id="cerrar-exito">Cerrar</button>
            </div>
        `;
    }

    if (btnComprar) {
        btnComprar.addEventListener("click", () => {
            const carrito = leerCarrito();
            if (carrito.items.length === 0) {
                abrirModal(`
                    <h3>Tu pedido está vacío</h3>
                    <p>Selecciona al menos un producto y una talla antes de hacer tu compra.</p>
                    <div class="modal-acciones">
                        <button type="button" class="epic" id="cerrar-vacio">Entendido</button>
                    </div>
                `);
                document.getElementById("cerrar-vacio").addEventListener("click", cerrarModal);
                return;
            }

            const metodo = obtenerMetodoGuardado();
            if (!metodo) {
                abrirModal(`
                    <h3>Falta tu método de pago</h3>
                    <p>Elige cómo quieres pagar antes de confirmar tu compra.</p>
                    <div class="modal-acciones">
                        <button type="button" class="epic" id="ir-a-pago">Elegir método de pago</button>
                    </div>
                `);
                document.getElementById("ir-a-pago").addEventListener("click", () => btnPago.click());
                return;
            }

            abrirModal(plantillaResumenCompra(carrito, metodo));
            document.getElementById("cancelar-compra").addEventListener("click", cerrarModal);
            document.getElementById("confirmar-compra").addEventListener("click", () => {
                abrirModal(plantillaProcesando());
                setTimeout(() => {
                    const diasEntrega = 3 + Math.floor(Math.random() * 3);
                    const pedido = {
                        id: generarFolio(),
                        items: carrito.items,
                        total: carrito.total,
                        metodo,
                        entrega: `${diasEntrega} días hábiles`,
                        creado: Date.now()
                    };
                    localStorage.setItem(CLAVE_PEDIDO, JSON.stringify(pedido));

                    // vaciar el carrito visualmente, ya que la "compra" se completó
                    document.querySelectorAll(".size-check").forEach((check) => {
                        check.checked = false;
                        const qty = check.closest(".size-option").querySelector(".size-qty");
                        qty.value = 1;
                        qty.disabled = true;
                    });
                    actualizarResumen();

                    abrirModal(plantillaExito(pedido));
                    document.getElementById("cerrar-exito").addEventListener("click", cerrarModal);
                    document.getElementById("ver-seguimiento").addEventListener("click", () => btnSeguimiento.click());
                }, 1600);
            });
        });
    }

    /* ---------- seguimiento de pedido ---------- */

    function calcularEtapa(minutosTranscurridos) {
        if (minutosTranscurridos < 1) return 0;
        if (minutosTranscurridos < 5) return 1;
        if (minutosTranscurridos < 30) return 2;
        if (minutosTranscurridos < 120) return 3;
        return 4;
    }

    function plantillaSeguimiento(pedido) {
        const etapas = [
            { titulo: "Pago confirmado", detalle: "Recibimos tu pago correctamente." },
            { titulo: "Pedido en preparación", detalle: "Estamos alistando tus productos." },
            { titulo: "Listo para envío", detalle: "Tu pedido está empacado y listo." },
            { titulo: "En camino", detalle: "Tu pedido va hacia tu domicilio." },
            { titulo: "Entregado", detalle: "Tu pedido fue entregado con éxito." }
        ];

        const minutos = (Date.now() - pedido.creado) / 60000;
        const etapaActual = calcularEtapa(minutos);

        const pasosHtml = etapas.map((etapa, i) => `
            <div class="paso ${i <= etapaActual ? "activo" : ""}">
                <div class="paso-punto">${i <= etapaActual ? "✓" : i + 1}</div>
                <div class="paso-texto">
                    <div class="paso-titulo">${etapa.titulo}</div>
                    <div class="paso-detalle">${etapa.detalle}</div>
                </div>
            </div>
        `).join("");

        return `
            <h3>Seguimiento de tu pedido</h3>
            <p>Pedido <strong>${pedido.id}</strong> · Total ${formatoMoneda(pedido.total)} · Entrega estimada: ${pedido.entrega}</p>
            <div class="pasos-tracker">${pasosHtml}</div>
            <div class="modal-acciones">
                <button type="button" class="epic secundario" id="cerrar-seguimiento">Cerrar</button>
            </div>
        `;
    }

    if (btnSeguimiento) {
        btnSeguimiento.addEventListener("click", () => {
            const guardado = localStorage.getItem(CLAVE_PEDIDO);
            if (!guardado) {
                abrirModal(`
                    <h3>Aún no tienes pedidos</h3>
                    <p>Cuando hagas una compra, aquí podrás ver el estado de tu pedido en tiempo real.</p>
                    <div class="modal-acciones">
                        <button type="button" class="epic" id="cerrar-sin-pedido">Entendido</button>
                    </div>
                `);
                document.getElementById("cerrar-sin-pedido").addEventListener("click", cerrarModal);
                return;
            }
            const pedido = JSON.parse(guardado);
            abrirModal(plantillaSeguimiento(pedido));
            document.getElementById("cerrar-seguimiento").addEventListener("click", cerrarModal);
        });
    }
})();
