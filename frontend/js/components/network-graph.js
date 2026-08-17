// ============================================
// 过敏原关系网络图 - 可交互力导向图
// 支持: 拖拽节点 / 滚轮缩放 / 拖拽平移 / 悬停高亮 / 点击固定
// ============================================

const NetworkGraph = {
    _token: 0,
    _colors: {
        confirmed: '#cf222e',
        high_risk: '#fd8c73',
        default: '#8b949e'
    },

    render(container, data) {
        const token = ++this._token;

        const nodes = (data.nodes || []).map(n => ({
            ...n,
            x: container.clientWidth / 2 + (Math.random() - 0.5) * 40,
            y: container.clientHeight / 2 + (Math.random() - 0.5) * 40,
            vx: 0,
            vy: 0,
            fx: null,
            fy: null,
            pinned: false
        }));
        const edges = (data.edges || [])
            .map(e => ({ ...e, source: nodes.find(n => n.id === e.source), target: nodes.find(n => n.id === e.target) }))
            .filter(e => e.source && e.target);

        container.innerHTML = '';
        container.classList.add('ng-container');

        const height = 380;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.classList.add('ng-svg');

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <filter id="ng-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
            </filter>
        `;
        svg.appendChild(defs);

        const viewport = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        viewport.classList.add('ng-viewport');
        const edgeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const nodeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        viewport.appendChild(edgeLayer);
        viewport.appendChild(nodeLayer);
        svg.appendChild(viewport);

        container.appendChild(svg);
        container.appendChild(this._buildToolbar());
        container.appendChild(this._buildLegend());

        // ---- 视图变换状态（缩放/平移）----
        const view = { scale: 1, tx: 0, ty: 0 };
        const applyTransform = () => {
            viewport.setAttribute('transform', `translate(${view.tx}, ${view.ty}) scale(${view.scale})`);
        };

        const toLocal = (clientX, clientY) => {
            const rect = svg.getBoundingClientRect();
            return {
                x: (clientX - rect.left - view.tx) / view.scale,
                y: (clientY - rect.top - view.ty) / view.scale
            };
        };

        // ---- 绘制边 ----
        edges.forEach(edge => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('stroke', '#8b949e');
            line.setAttribute('stroke-width', Math.min(1 + edge.weight * 1.4, 6));
            line.setAttribute('opacity', 0.45);
            line.classList.add('ng-edge');
            line.style.cursor = 'pointer';
            edgeLayer.appendChild(line);
            edge.el = line;

            line.addEventListener('mouseenter', () => this._focusEdge(edge, nodes, edges, line));
            line.addEventListener('mousemove', e => this._showTooltip(e, `
                <div class="tooltip-date">${edge.source.label} ↔ ${edge.target.label}</div>
                <div style="color:#8b949e;">Eaten together in ${edge.weight} symptomatic meal${edge.weight > 1 ? 's' : ''}</div>
            `));
            line.addEventListener('mouseleave', () => this._clearFocus(nodes, edges));
        });

        // ---- 绘制节点 ----
        nodes.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.classList.add('ng-node');
            g.style.cursor = 'grab';
            g.setAttribute('filter', 'url(#ng-shadow)');

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', node.size);
            circle.setAttribute('fill', this._colors[node.type] || this._colors.default);
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', 3);

            const pinRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            pinRing.setAttribute('r', node.size + 5);
            pinRing.setAttribute('fill', 'none');
            pinRing.setAttribute('stroke', '#0969da');
            pinRing.setAttribute('stroke-width', 2);
            pinRing.setAttribute('stroke-dasharray', '4 3');
            pinRing.style.display = 'none';
            pinRing.classList.add('ng-pin-ring');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dy', node.size + 18);
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', '600');
            text.setAttribute('fill', '#24292f');
            text.style.paintOrder = 'stroke';
            text.style.stroke = '#fff';
            text.style.strokeWidth = '3px';
            text.textContent = node.label;

            g.appendChild(pinRing);
            g.appendChild(circle);
            g.appendChild(text);
            nodeLayer.appendChild(g);
            node.el = g;
            node.pinRingEl = pinRing;

            this._attachNodeDrag(g, node, nodes, edges, toLocal, () => { alpha = 1; wake(); });
        });

        // ---- 缩放（滚轮）----
        svg.addEventListener('wheel', e => {
            e.preventDefault();
            const before = toLocal(e.clientX, e.clientY);
            view.scale = Math.min(2.5, Math.max(0.4, view.scale * (1 - e.deltaY * 0.001)));
            const rect = svg.getBoundingClientRect();
            view.tx = e.clientX - rect.left - before.x * view.scale;
            view.ty = e.clientY - rect.top - before.y * view.scale;
            applyTransform();
        }, { passive: false });

        // ---- 平移（拖拽背景）----
        let panning = false, panStart = null;
        svg.addEventListener('pointerdown', e => {
            if (e.target !== svg) return;
            panning = true;
            panStart = { x: e.clientX - view.tx, y: e.clientY - view.ty };
            svg.style.cursor = 'grabbing';
        });
        window.addEventListener('pointermove', e => {
            if (!panning) return;
            view.tx = e.clientX - panStart.x;
            view.ty = e.clientY - panStart.y;
            applyTransform();
        });
        window.addEventListener('pointerup', () => { panning = false; svg.style.cursor = 'default'; });
        svg.addEventListener('dblclick', e => {
            if (e.target !== svg) return;
            view.scale = 1; view.tx = 0; view.ty = 0;
            applyTransform();
        });

        // ---- 力导向模拟 ----
        let alpha = 1;
        let running = false;
        const MIN_ALPHA = 0.01;

        const wake = () => {
            if (!running) { running = true; requestAnimationFrame(tick); }
        };

        const tick = () => {
            if (token !== this._token) return; // 页面已重新渲染，停止旧的循环

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const minDist = a.size + b.size + 30;
                    const force = dist < minDist ? (minDist - dist) * 0.08 : 900 / (dist * dist);
                    const fx = (dx / dist) * force, fy = (dy / dist) * force;
                    if (a.fx === null) { a.vx -= fx; a.vy -= fy; }
                    if (b.fx === null) { b.vx += fx; b.vy += fy; }
                }
            }

            edges.forEach(edge => {
                const idealDist = 130 / (1 + edge.weight * 0.25);
                const dx = edge.target.x - edge.source.x, dy = edge.target.y - edge.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist - idealDist) * 0.02;
                const fx = (dx / dist) * force, fy = (dy / dist) * force;
                if (edge.source.fx === null) { edge.source.vx += fx; edge.source.vy += fy; }
                if (edge.target.fx === null) { edge.target.vx -= fx; edge.target.vy -= fy; }
            });

            const cx = container.clientWidth / 2, cy = height / 2;
            nodes.forEach(node => {
                if (node.fx !== null) {
                    node.x = node.fx; node.y = node.fy; node.vx = 0; node.vy = 0;
                } else {
                    node.vx += (cx - node.x) * 0.003;
                    node.vy += (cy - node.y) * 0.003;
                    node.vx *= 0.82; node.vy *= 0.82;
                    node.x += node.vx * alpha;
                    node.y += node.vy * alpha;
                    const margin = node.size + 30;
                    node.x = Math.max(margin, Math.min(Math.max(container.clientWidth, margin * 2) - margin, node.x));
                    node.y = Math.max(margin, Math.min(height - margin, node.y));
                }
                node.el.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            });

            edges.forEach(edge => {
                edge.el.setAttribute('x1', edge.source.x);
                edge.el.setAttribute('y1', edge.source.y);
                edge.el.setAttribute('x2', edge.target.x);
                edge.el.setAttribute('y2', edge.target.y);
            });

            alpha *= 0.996;
            if (alpha > MIN_ALPHA) {
                requestAnimationFrame(tick);
            } else {
                running = false;
            }
        };

        wake();

        // 缩放工具栏按钮
        const toolbar = container.querySelector('.ng-toolbar');
        toolbar.querySelector('[data-zoom="in"]').onclick = () => {
            view.scale = Math.min(2.5, view.scale * 1.25); applyTransform();
        };
        toolbar.querySelector('[data-zoom="out"]').onclick = () => {
            view.scale = Math.max(0.4, view.scale / 1.25); applyTransform();
        };
        toolbar.querySelector('[data-zoom="reset"]').onclick = () => {
            view.scale = 1; view.tx = 0; view.ty = 0; applyTransform();
            nodes.forEach(n => { n.fx = null; n.fy = null; n.pinned = false; n.pinRingEl.style.display = 'none'; });
            alpha = 1; wake();
        };
    },

    _attachNodeDrag(g, node, nodes, edges, toLocal, reheat) {
        let dragging = false, startClient = null, moved = false;

        g.addEventListener('pointerdown', e => {
            e.stopPropagation();
            g.setPointerCapture(e.pointerId);
            dragging = true; moved = false;
            startClient = { x: e.clientX, y: e.clientY };
            g.style.cursor = 'grabbing';
        });

        g.addEventListener('pointermove', e => {
            if (!dragging) return;
            const dx = e.clientX - startClient.x, dy = e.clientY - startClient.y;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            if (moved) {
                const p = toLocal(e.clientX, e.clientY);
                node.fx = p.x; node.fy = p.y;
                reheat();
            }
        });

        g.addEventListener('pointerup', e => {
            dragging = false;
            g.style.cursor = 'grab';
            if (!moved) {
                // 视为点击：切换固定/取消固定
                if (node.pinned) {
                    node.pinned = false; node.fx = null; node.fy = null;
                    node.pinRingEl.style.display = 'none';
                } else {
                    node.pinned = true; node.fx = node.x; node.fy = node.y;
                    node.pinRingEl.style.display = '';
                }
                reheat();
            } else if (!node.pinned) {
                node.fx = null; node.fy = null;
            } else {
                node.pinRingEl.style.display = '';
            }
        });

        g.addEventListener('mouseenter', e => this._focusNode(node, nodes, edges));
        g.addEventListener('mousemove', e => this._showTooltip(e, this._nodeTooltip(node, edges)));
        g.addEventListener('mouseleave', () => this._clearFocus(nodes, edges));
    },

    _nodeTooltip(node, edges) {
        const linked = edges.filter(e => e.source === node || e.target === node).length;
        const typeLabel = node.type === 'confirmed' ? '⚠️ Confirmed Allergen' : node.type === 'high_risk' ? '🔴 High-Risk Food' : 'Food';
        return `
            <div class="tooltip-date">${node.label}</div>
            <div style="color:#8b949e;">${typeLabel}${node.score ? ` · ${node.score}% confidence` : ''}</div>
            <div style="color:#8b949e;">Linked to ${linked} food${linked !== 1 ? 's' : ''}</div>
        `;
    },

    _focusNode(node, nodes, edges) {
        const connected = new Set([node]);
        edges.forEach(e => {
            if (e.source === node) connected.add(e.target);
            if (e.target === node) connected.add(e.source);
        });
        nodes.forEach(n => n.el.style.opacity = connected.has(n) ? 1 : 0.2);
        edges.forEach(e => {
            const active = e.source === node || e.target === node;
            e.el.style.opacity = active ? 0.9 : 0.08;
            e.el.setAttribute('stroke', active ? '#0969da' : '#8b949e');
        });
    },

    _focusEdge(edge, nodes, edges, line) {
        nodes.forEach(n => n.el.style.opacity = (n === edge.source || n === edge.target) ? 1 : 0.2);
        edges.forEach(e => {
            e.el.style.opacity = e === edge ? 0.9 : 0.08;
            e.el.setAttribute('stroke', e === edge ? '#0969da' : '#8b949e');
        });
    },

    _clearFocus(nodes, edges) {
        nodes.forEach(n => n.el.style.opacity = 1);
        edges.forEach(e => { e.el.style.opacity = 0.45; e.el.setAttribute('stroke', '#8b949e'); });
        this._hideTooltip();
    },

    _showTooltip(e, html) {
        const tip = document.getElementById('heatmapTooltip');
        tip.innerHTML = html;
        tip.style.display = 'block';
        tip.style.left = e.clientX + 16 + 'px';
        tip.style.top = e.clientY - 10 + 'px';
    },

    _hideTooltip() {
        document.getElementById('heatmapTooltip').style.display = 'none';
    },

    _buildToolbar() {
        const div = document.createElement('div');
        div.className = 'ng-toolbar';
        div.innerHTML = `
            <button type="button" data-zoom="in" title="Zoom in">+</button>
            <button type="button" data-zoom="out" title="Zoom out">−</button>
            <button type="button" data-zoom="reset" title="Reset layout">⟳</button>
        `;
        return div;
    },

    _buildLegend() {
        const div = document.createElement('div');
        div.className = 'ng-legend';
        div.innerHTML = `
            <div class="ng-legend-item"><span class="ng-legend-dot" style="background:${this._colors.confirmed}"></span>Confirmed allergen</div>
            <div class="ng-legend-item"><span class="ng-legend-dot" style="background:${this._colors.high_risk}"></span>High-risk food</div>
            <div class="ng-legend-item">— Thicker line = eaten together more often</div>
            <div class="ng-legend-hint">🖱️ Drag nodes · Click to pin · Scroll to zoom · Drag background to pan</div>
        `;
        return div;
    }
};
