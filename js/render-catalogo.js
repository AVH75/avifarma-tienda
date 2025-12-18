// =========================
// Función para obtener el precio final de un producto
// =========================
function obtenerPrecioFinal(producto) {
  if (producto.precio_con_descuento && producto.precio_con_descuento > 0) {
    return producto.precio_con_descuento;
  }
  if (producto.precio_oferta && producto.precio_oferta > 0) {
    return producto.precio_oferta;
  }
  return producto.precio ?? 0;
}

// =========================
// Renderizado de Productos, Ofertas y Novedades
// =========================
function mostrarItems(lista, contenedorId, tipo = "producto") {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;
  contenedor.innerHTML = "";

  lista.forEach(item => {
    const imageUrl = item.img ?? "img/default-image.jpg";

    // --------------------------- Novedades ---------------------------
    if (tipo === "novedad") {
      const card = document.createElement("div");
      card.className = "card card-novedad";

      card.innerHTML = `
        <div class="img-wrapper">
          <img src="${imageUrl}" alt="${item.titulo ?? 'Imagen de novedad'}" class="img-novedad">
        </div>
        <div class="card-content">
          <h3>${item.titulo ?? 'Novedad'}</h3>
          <small class="fecha-novedad">${item.fecha ?? ''}</small>
          <p>${item.descripcion ?? ''}</p>
          ${item.link || item.boton ? `<a href="${item.link ?? '#'}" target="_blank" class="btn-leer-mas">${item.boton ?? 'Leer más'}</a>` : ''}
        </div>
      `;
      contenedor.appendChild(card);
      return;
    }

    // --------------------------- Productos / Ofertas ---------------------------
    const card = document.createElement("div");
    card.className = "card-" + tipo;
    card.style.position = "relative";

    card.innerHTML = `
      <img src="${imageUrl}" alt="${item.nombre ?? 'Producto sin nombre'}" loading="lazy">
      <h3>${item.nombre ?? 'Producto sin nombre'}</h3>
      ${item.descripcion ? `<p>${item.descripcion}</p>` : ''}
    `;

    // Etiqueta de oferta
    if (item.etiqueta || item.descuento || item.precio_con_descuento) {
      const tag = document.createElement("div");
      tag.className = "oferta-tag";
      tag.textContent = item.etiqueta ?? item.descuento ?? "Oferta";
      tag.style.backgroundColor = "#28a745"; // verde por defecto
      card.prepend(tag);
    }

    // Precios
    const preciosDiv = document.createElement("div");
    preciosDiv.className = "precios";
    const precioFinal = obtenerPrecioFinal(item);

    if (item.precio_con_descuento && item.precio_con_descuento < (item.precio ?? 0)) {
      const ahorro = item.ahorro ?? ((item.precio ?? 0) - item.precio_con_descuento);
      preciosDiv.innerHTML = `
        <span class="precio-regular"><s>S/ ${(item.precio ?? 0).toFixed(2)}</s></span>
        <span class="precio-descuento">S/ ${item.precio_con_descuento.toFixed(2)}</span>
        <div class="ahorro">Ahorro: S/ ${ahorro.toFixed(2)}</div>
      `;
    } else {
      preciosDiv.innerHTML = `<span class="precio">S/ ${precioFinal.toFixed(2)}</span>`;
    }
    card.appendChild(preciosDiv);
    
// Botón agregar al carrito (corregido)
const button = document.createElement("button");
button.textContent = "Agregar al carrito";
button.className = "btn-agregar-carrito"; // 👈 clase correcta que usa carrito.js
button.dataset.id = item.id;               // 👈 guarda el ID del producto
card.appendChild(button);

contenedor.appendChild(card);
});
}


// =========================
// Carrusel de Banners
// =========================
function mostrarCarruselBanners(banners) {
  const slider = document.getElementById("slider-banner");
  if (!slider) return;
  slider.innerHTML = "";

  banners.forEach(item => {
    const slide = document.createElement("div");
    slide.classList.add("slide");
    slide.innerHTML = `<img src="${item.src}" alt="${item.alt}" style="width:100%;height:100%;object-fit:cover;">`;
    slider.appendChild(slide);
  });

  let currentIndex = 0;
  const slides = slider.querySelectorAll(".slide");
  const totalSlides = slides.length;

  const dotsContainer = document.getElementById("dots");
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    banners.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = "dot";
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateSlider();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === currentIndex));
  }

  function updateSlider() {
    const offset = -currentIndex * slides[0].offsetWidth;
    slider.style.transform = `translateX(${offset}px)`;
    updateDots();
  }

  function nextSlide() { currentIndex = (currentIndex + 1) % totalSlides; updateSlider(); }
  function prevSlide() { currentIndex = (currentIndex - 1 + totalSlides) % totalSlides; updateSlider(); }

  document.querySelector(".prev")?.addEventListener("click", prevSlide);
  document.querySelector(".next")?.addEventListener("click", nextSlide);

  let autoplay = setInterval(nextSlide, 5000);
  slider.parentElement.addEventListener("mouseenter", () => clearInterval(autoplay));
  slider.parentElement.addEventListener("mouseleave", () => autoplay = setInterval(nextSlide, 5000));

  updateSlider();
}

// =========================
// Carrusel de Servicios
// =========================
function mostrarCarruselServicios(servicios) {
  const slider = document.getElementById("slider-servicios");
  if (!slider) return;

  const contenedor = slider.querySelector("#servicios-carousel");
  contenedor.innerHTML = "";

  servicios.forEach(servicio => {
    const card = document.createElement("div");
    card.className = "card-servicio";
    card.innerHTML = `
      <img src="${servicio.imagen ?? 'img/default-image.jpg'}" alt="${servicio.titulo}">
      <h3>${servicio.titulo}</h3>
      <p>${servicio.descripcion}</p>
    `;
    contenedor.appendChild(card);
  });

  const cards = contenedor.querySelectorAll(".card-servicio");
  if (!cards.length) return;

  let currentIndex = 0;
  const cardWidth = cards[0].offsetWidth +
      parseInt(getComputedStyle(cards[0]).marginLeft) +
      parseInt(getComputedStyle(cards[0]).marginRight);
  const visibleCards = Math.floor(slider.offsetWidth / cardWidth) || 1;
  const maxIndex = Math.max(cards.length - visibleCards, 0);

  const dotsContainer = slider.querySelector(".dots-servicios");
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => { currentIndex = i; updateCarousel(); resetAutoSlide(); });
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === currentIndex));
  }

  function updateCarousel() {
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    if (currentIndex < 0) currentIndex = 0;
    contenedor.style.transform = `translateX(${-currentIndex * cardWidth}px)`;
    updateDots();
  }

  slider.querySelector(".next-servicio")?.addEventListener("click", () => {
    currentIndex = (currentIndex < maxIndex ? currentIndex + 1 : 0);
    updateCarousel();
    resetAutoSlide();
  });

  slider.querySelector(".prev-servicio")?.addEventListener("click", () => {
    currentIndex = (currentIndex > 0 ? currentIndex - 1 : maxIndex);
    updateCarousel();
    resetAutoSlide();
  });

  let autoSlide = setInterval(() => {
    currentIndex = (currentIndex < maxIndex ? currentIndex + 1 : 0);
    updateCarousel();
  }, 4000);

  function resetAutoSlide() {
    clearInterval(autoSlide);
    autoSlide = setInterval(() => {
      currentIndex = (currentIndex < maxIndex ? currentIndex + 1 : 0);
      updateCarousel();
    }, 4000);
  }

  updateCarousel();
}

// =========================
// Mostrar Categorías y Subcategorías
// =========================
function mostrarCategorias(categorias) {
  const menuCategorias = document.getElementById('menu-categorias');
  menuCategorias.innerHTML = '';

  categorias.forEach(categoria => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#" onclick="mostrarProductosPorCategoria(${categoria.id})">${categoria.nombre}</a>`;
    menuCategorias.appendChild(li);

    if (categoria.subcategorias?.length) {
      const ul = document.createElement('ul');
      categoria.subcategorias.forEach(sub => {
        const subLi = document.createElement('li');
        subLi.innerHTML = `<a href="#" onclick="mostrarProductosPorSubcategoria(${sub.id})">${sub.nombre}</a>`;
        ul.appendChild(subLi);
      });
      li.appendChild(ul);
    }
  });
}

// =========================
// TopBar
// =========================
function mostrarTopBar(data) {
  const topBar = document.getElementById("top-bar");
  if (!topBar || !data.topBar) return;

  topBar.innerHTML = "";

  const titulo = document.createElement("span");
  titulo.className = "titulo";
  titulo.textContent = data.topBar.titulo ?? "";
  topBar.appendChild(titulo);

  if (data.topBar.direccion) {
    const direccion = document.createElement("span");
    direccion.className = "direccion";
    direccion.textContent = data.topBar.direccion;
    topBar.appendChild(direccion);
  }

  if (data.topBar.email) {
    const email = document.createElement("a");
    email.href = `mailto:${data.topBar.email}`;
    email.className = "email";
    email.textContent = data.topBar.email;
    topBar.appendChild(email);
  }

  if (Array.isArray(data.topBar.links)) {
    data.topBar.links.forEach(link => {
      const a = document.createElement("a");
      a.href = link.url;
      a.target = "_blank";
      a.textContent = link.nombre;
      topBar.appendChild(a);
    });
  }
}

// =========================
// Mostrar productos por Categoría
// =========================
function mostrarProductosPorCategoria(categoriaId) {
  fetch('productos.json')
    .then(res => res.json())
    .then(data => {
      const categoria = data.categorias.find(c => c.id === categoriaId);
      if (!categoria) return;

      const subIds = categoria.subcategorias?.map(s => s.id) || [];
      const filtrados = data.productos.filter(p => p.categoria === categoriaId || subIds.includes(p.subcategoria));

      const tituloCatalogo = document.getElementById("titulo-catalogo");
      if (tituloCatalogo) tituloCatalogo.textContent = `Catálogo – ${categoria.nombre}`;

      const anterior = document.querySelector(".subcategorias-lista");
      if (anterior) anterior.remove();

      if (categoria.subcategorias?.length) {
        const listaSubs = document.createElement("div");
        listaSubs.classList.add("subcategorias-lista");
        categoria.subcategorias.forEach(sub => {
          const btn = document.createElement("button");
          btn.textContent = sub.nombre;
          btn.classList.add("btn-subcategoria");
          btn.onclick = () => {
            document.querySelectorAll('.btn-subcategoria').forEach(b => b.classList.remove('activa'));
            btn.classList.add('activa');
            mostrarProductosPorSubcategoria(sub.id);
          };
          listaSubs.appendChild(btn);
        });
        tituloCatalogo.insertAdjacentElement("afterend", listaSubs);
      }

      mostrarItems(filtrados, 'catalogo', 'producto');
    })
    .catch(err => console.error(err));
}

// =========================
// Mostrar productos por Subcategoría
// =========================
function mostrarProductosPorSubcategoria(subcategoriaId) {
  fetch('productos.json')
    .then(res => res.json())
    .then(data => {
      const sub = data.categorias.flatMap(c => c.subcategorias || []).find(s => s.id === subcategoriaId);
      if (!sub) return;

      const filtrados = data.productos.filter(p => p.subcategoria === subcategoriaId);
      const tituloCatalogo = document.getElementById("titulo-catalogo");
      if (tituloCatalogo) tituloCatalogo.textContent = `Catálogo – ${sub.nombre}`;

      if (filtrados.length === 0) {
        document.getElementById("catalogo").innerHTML = `<p class="text-gray-500 p-4">No hay productos disponibles en esta subcategoría.</p>`;
        return;
      }

      mostrarItems(filtrados, "catalogo", "producto");
    })
    .catch(err => console.error(err));
}

// =========================
// Ajuste dinámico de padding-top del body
// =========================
function ajustarPaddingBody() {
  const promoBar = document.querySelector('.promo-bar');
  const topBar = document.querySelector('.top-bar');
  const mainHeader = document.querySelector('.main-header');

  let totalAltura = 0;
  if (promoBar) totalAltura += promoBar.offsetHeight;
  if (topBar) totalAltura += topBar.offsetHeight;
  if (mainHeader) totalAltura += mainHeader.offsetHeight;

  document.body.style.paddingTop = totalAltura + 'px';
}

window.addEventListener('resize', ajustarPaddingBody);

// =========================
// Cargar JSON y renderizado inicial
// =========================
fetch("./productos.json")
  .then(res => res.json())
  .then(data => {
    // Renderizado general
    mostrarTopBar(data);
    if (data.categorias) mostrarCategorias(data.categorias);
    if (data.productos) mostrarItems(data.productos, "productos-grid", "producto");
    if (data.novedades) mostrarItems(data.novedades, "novedades-grid", "novedad");
    if (data.BannerCarrusel) mostrarCarruselBanners(data.BannerCarrusel);
    if (data.servicios) mostrarCarruselServicios(data.servicios);

    ajustarPaddingBody();

    // ✅ Hacer que el catálogo esté disponible globalmente para carrito.js
    window.catalogo = data.productos || [];

    // ✅ Avisar a carrito.js que ya se cargó el catálogo
    document.dispatchEvent(new Event("catalogoListo"));
  })
  .catch(err => console.error("Error cargando productos.json:", err));
