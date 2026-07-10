function t(t,e,s,o){var r,n=arguments.length,i=n<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,s):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(t,e,s,o);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(i=(n<3?r(i):n>3?r(e,s,i):r(e,s))||i);return n>3&&i&&Object.defineProperty(e,s,i),i}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),r=new WeakMap;let n=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&r.set(e,t))}return t}toString(){return this.cssText}};const i=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1],t[0]);return new n(s,t,o)},a=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,o))(e)})(t):t,{is:l,defineProperty:h,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:_}=Object,y=globalThis,$=y.trustedTypes,m=$?$.emptyScript:"",u=y.reactiveElementPolyfillSupport,f=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},g=(t,e)=>!l(t,e),v={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:g};Symbol.metadata??=Symbol("metadata"),y.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=v){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),o=this.getPropertyDescriptor(t,s,e);void 0!==o&&h(this.prototype,t,o)}}static getPropertyDescriptor(t,e,s){const{get:o,set:r}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const n=o?.call(this);r?.call(this,e),this.requestUpdate(t,n,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??v}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=_(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,o)=>{if(s)t.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of o){const o=document.createElement("style"),r=e.litNonce;void 0!==r&&o.setAttribute("nonce",r),o.textContent=s.cssText,t.appendChild(o)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,s);if(void 0!==o&&!0===s.reflect){const r=(void 0!==s.converter?.toAttribute?s.converter:x).toAttribute(e,s.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,e){const s=this.constructor,o=s._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=s.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=o;const n=r.fromAttribute(e,t.type);this[o]=n??this._$Ej?.get(o)??n,this._$Em=null}}requestUpdate(t,e,s,o=!1,r){if(void 0!==t){const n=this.constructor;if(!1===o&&(r=this[t]),s??=n.getPropertyOptions(t),!((s.hasChanged??g)(r,e)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:o,wrapped:r},n){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==r||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,s,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[f("elementProperties")]=new Map,b[f("finalized")]=new Map,u?.({ReactiveElement:b}),(y.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=t=>t,A=w.trustedTypes,E=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+M,C=`<${P}>`,z=document,L=()=>z.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,T="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,j=/>/g,R=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,D=/"/g,F=/^(?:script|style|textarea|title)$/i,W=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),B=W(1),V=W(2),Z=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),G=new WeakMap,K=z.createTreeWalker(z,129);function J(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const Y=(t,e)=>{const s=t.length-1,o=[];let r,n=2===e?"<svg>":3===e?"<math>":"",i=H;for(let e=0;e<s;e++){const s=t[e];let a,l,h=-1,c=0;for(;c<s.length&&(i.lastIndex=c,l=i.exec(s),null!==l);)c=i.lastIndex,i===H?"!--"===l[1]?i=N:void 0!==l[1]?i=j:void 0!==l[2]?(F.test(l[2])&&(r=RegExp("</"+l[2],"g")),i=R):void 0!==l[3]&&(i=R):i===R?">"===l[0]?(i=r??H,h=-1):void 0===l[1]?h=-2:(h=i.lastIndex-l[2].length,a=l[1],i=void 0===l[3]?R:'"'===l[3]?D:I):i===D||i===I?i=R:i===N||i===j?i=H:(i=R,r=void 0);const d=i===R&&t[e+1].startsWith("/>")?" ":"";n+=i===H?s+C:h>=0?(o.push(a),s.slice(0,h)+S+s.slice(h)+M+d):s+M+(-2===h?e:d)}return[J(t,n+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class Q{constructor({strings:t,_$litType$:e},s){let o;this.parts=[];let r=0,n=0;const i=t.length-1,a=this.parts,[l,h]=Y(t,e);if(this.el=Q.createElement(l,s),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=K.nextNode())&&a.length<i;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(S)){const e=h[n++],s=o.getAttribute(t).split(M),i=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:i[2],strings:s,ctor:"."===i[1]?ot:"?"===i[1]?rt:"@"===i[1]?nt:st}),o.removeAttribute(t)}else t.startsWith(M)&&(a.push({type:6,index:r}),o.removeAttribute(t));if(F.test(o.tagName)){const t=o.textContent.split(M),e=t.length-1;if(e>0){o.textContent=A?A.emptyScript:"";for(let s=0;s<e;s++)o.append(t[s],L()),K.nextNode(),a.push({type:2,index:++r});o.append(t[e],L())}}}else if(8===o.nodeType)if(o.data===P)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(M,t+1));)a.push({type:7,index:r}),t+=M.length-1}r++}}static createElement(t,e){const s=z.createElement("template");return s.innerHTML=t,s}}function X(t,e,s=t,o){if(e===Z)return e;let r=void 0!==o?s._$Co?.[o]:s._$Cl;const n=O(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),void 0===n?r=void 0:(r=new n(t),r._$AT(t,s,o)),void 0!==o?(s._$Co??=[])[o]=r:s._$Cl=r),void 0!==r&&(e=X(t,r._$AS(t,e.values),r,o)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,o=(t?.creationScope??z).importNode(e,!0);K.currentNode=o;let r=K.nextNode(),n=0,i=0,a=s[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new et(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new it(r,this,t)),this._$AV.push(e),a=s[++i]}n!==a?.index&&(r=K.nextNode(),n++)}return K.currentNode=z,o}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,o){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),O(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==Z&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(z.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,o="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Q.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new tt(o,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new Q(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,o=0;for(const r of t)o===e.length?e.push(s=new et(this.O(L()),this.O(L()),this,this.options)):s=e[o],s._$AI(r),o++;o<e.length&&(this._$AR(s&&s._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class st{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,o,r){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=r,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=q}_$AI(t,e=this,s,o){const r=this.strings;let n=!1;if(void 0===r)t=X(this,t,e,0),n=!O(t)||t!==this._$AH&&t!==Z,n&&(this._$AH=t);else{const o=t;let i,a;for(t=r[0],i=0;i<r.length-1;i++)a=X(this,o[s+i],e,i),a===Z&&(a=this._$AH[i]),n||=!O(a)||a!==this._$AH[i],a===q?t=q:t!==q&&(t+=(a??"")+r[i+1]),this._$AH[i]=a}n&&!o&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class ot extends st{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class rt extends st{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class nt extends st{constructor(t,e,s,o,r){super(t,e,s,o,r),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??q)===Z)return;const s=this._$AH,o=t===q&&s!==q||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==q&&(s===q||o);o&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class it{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const at=w.litHtmlPolyfillSupport;at?.(Q,et),(w.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;class ht extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const o=s?.renderBefore??e;let r=o._$litPart$;if(void 0===r){const t=s?.renderBefore??null;o._$litPart$=r=new et(e.insertBefore(L(),t),t,void 0,s??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Z}}ht._$litElement$=!0,ht.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ht});const ct=lt.litElementPolyfillSupport;ct?.({LitElement:ht}),(lt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:g},_t=(t=pt,e,s)=>{const{kind:o,metadata:r}=s;let n=globalThis.litPropertyMetadata.get(r);if(void 0===n&&globalThis.litPropertyMetadata.set(r,n=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),n.set(s.name,t),"accessor"===o){const{name:o}=s;return{set(s){const r=e.get.call(this);e.set.call(this,s),this.requestUpdate(o,r,t,!0,s)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=s;return function(s){const r=this[o];e.call(this,s),this.requestUpdate(o,r,t,!0,s)}}throw Error("Unsupported decorator location: "+o)};function yt(t){return(e,s)=>"object"==typeof s?_t(t,e,s):((t,e,s)=>{const o=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),o?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function $t(t){return yt({...t,state:!0,attribute:!1})}const mt={red:"#ff5252",yellow:"#ffd740",green:"#00e676"};function ut(t,e){if(!e||null==e.yellow_from&&null==e.green_from)return;const s=e.yellow_from??e.green_from,o=Math.max(e.green_from??e.yellow_from,s);let r=t<s?"red":t<o?"yellow":"green";return e.severity_invert&&(r="red"===r?"green":"green"===r?"red":"yellow"),mt[r]}function ft(t,e,s=0){if(!t||!e)return s;const o=t.states[e];if(!o)return s;const r=parseFloat(o.state);return Number.isFinite(r)?r:s}function xt(t,e){if(!t||!e)return!1;const s=t.states[e];return!!s&&Number.isFinite(parseFloat(s.state))}const gt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:1}),vt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2}),bt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:0});function wt(t){const e=Math.abs(t);return e>=1e4?`${gt.format(t/1e3)} kW`:e>=1e3?`${vt.format(t/1e3)} kW`:`${bt.format(t)} W`}function kt(t){return Math.abs(t)>=1e3?`${vt.format(t/1e3)} MWh`:`${gt.format(t)} kWh`}function At(t,e){if(!t||!e)return"—";const s=t.states[e];if(!s||"unknown"===s.state||"unavailable"===s.state)return"—";const o=s.attributes.unit_of_measurement??"",r=parseFloat(s.state);return Number.isFinite(r)&&String(r)===s.state.trim()?o?`${gt.format(r)} ${o}`:gt.format(r):o?`${s.state} ${o}`:s.state}function Et(t,e,s){t.dispatchEvent(new CustomEvent(e,{detail:s,bubbles:!0,composed:!0,cancelable:!1}))}function St(t,e,s){if(s.hidden)return q;const o=s.animate&&Math.abs(s.power)>=s.deadband,r=`flow-${t}`,n=V`
    <path id="${r}" d="${e}" fill="none"
      stroke="${o?s.color:"rgba(148, 170, 190, 0.16)"}"
      stroke-width="${o?3:2}"
      stroke-linecap="round"
      opacity="${o?.85:1}"
      style="${o?`filter: drop-shadow(0 0 4px ${s.color})`:""}"/>`;if(!o)return n;const i=function(t,e,s,o){const r=Math.min(1,Math.max(0,t/Math.max(1,e))),n=Math.max(s,o-r*(o-s));return Math.round(4*n)/4}(Math.abs(s.power),s.maxPower,s.minDuration,s.maxDuration),a=s.reverse?"1;0":"0;1",l=Math.max(1,s.dots),h=[];for(let t=0;t<l;t++){const e=-(t*i/l).toFixed(2);h.push(V`
      <circle cx="0" cy="0" r="5" fill="${s.color}"
        style="filter: drop-shadow(0 0 6px ${s.color})">
        <animateMotion dur="${i}s" begin="${e}s" repeatCount="indefinite"
          keyPoints="${a}" keyTimes="0;1" calcMode="linear">
          <mpath href="#${r}"/>
        </animateMotion>
      </circle>`)}return V`${n}${h}`}const Mt={entity:{domain:"sensor"}},Pt={text:{}},Ct={icon:{}},zt={boolean:{}},Lt=(t,e,s=1)=>({number:{min:t,max:e,step:s,mode:"box"}}),Ot=[{name:"yellow_from",selector:Lt(0,2e4,50)},{name:"green_from",selector:Lt(0,2e4,50)},{name:"bar_max",selector:Lt(100,3e4,100)},{name:"severity_invert",selector:zt}],Ut=[{name:"yellow_from",selector:Lt(0,100,1)},{name:"green_from",selector:Lt(0,100,1)}],Tt=[{name:"title",selector:Pt},{name:"pv",type:"expandable",icon:"mdi:solar-power",schema:[{name:"power",required:!0,selector:Mt},{name:"energy_today",selector:Mt},{name:"energy_total",selector:Mt},{name:"max_power_today",selector:Mt},{name:"voltage",selector:Mt},{name:"current",selector:Mt},{name:"mppt_state",selector:Mt},...Ot]},{name:"battery",type:"expandable",icon:"mdi:battery-high",schema:[{name:"soc",required:!0,selector:Mt},{name:"power",selector:Mt},{name:"voltage",selector:Mt},{name:"current",selector:Mt},{name:"temperature",selector:Mt},{name:"soh",selector:Mt},{name:"runtime",selector:Mt},{name:"time_to_full",selector:Mt},{name:"capacity",selector:Mt},{name:"invert",selector:zt},...Ut]},{name:"inverter",type:"expandable",icon:"mdi:sine-wave",schema:[{name:"power",selector:Mt},{name:"state",selector:Mt},{name:"load_power",selector:Mt},{name:"name",selector:Pt},...Ot]},{name:"grid",type:"expandable",icon:"mdi:transmission-tower",schema:[{name:"power",selector:Mt},{name:"phase_a",selector:Mt},{name:"phase_b",selector:Mt},{name:"phase_c",selector:Mt},{name:"energy_total",selector:Mt},{name:"energy_today",selector:Mt},{name:"name",selector:Pt},...Ot]},{name:"solcast",type:"expandable",icon:"mdi:weather-sunny",schema:[{name:"power_now",selector:Mt},{name:"remaining_today",selector:Mt},{name:"total_today",selector:Mt}]},{name:"options",type:"expandable",icon:"mdi:tune",schema:[{name:"max_flow_w",selector:Lt(500,2e4,100)},{name:"deadband_w",selector:Lt(0,500,5)},{name:"dots",selector:Lt(1,8)},{name:"min_duration",selector:Lt(.5,10,.1)},{name:"max_duration",selector:Lt(1,20,.5)},{name:"animation",selector:zt}]}],Ht=[{name:"name",required:!0,selector:Pt},{name:"grid_power",selector:Mt},{name:"grid_energy",selector:Mt},{name:"island_power",selector:Mt},{name:"island_energy",selector:Mt},{name:"phase_a_entity",selector:Mt},{name:"phase_a_name",selector:Pt},{name:"phase_a_icon",selector:Ct},{name:"phase_b_entity",selector:Mt},{name:"phase_b_name",selector:Pt},{name:"phase_b_icon",selector:Ct},{name:"phase_c_entity",selector:Mt},{name:"phase_c_name",selector:Pt},{name:"phase_c_icon",selector:Ct}],Nt={title:"Titulek karty",pv:"FVE / MPPT",battery:"Baterie",inverter:"Měnič (ostrov)",grid:"Síť (grid)",solcast:"Předpověď Solcast",options:"Chování a animace",power:"Výkon (W)",energy_today:"Energie dnes (kWh)",energy_total:"Energie celkem (kWh)",max_power_today:"Maximální výkon dnes (W)",voltage:"Napětí (V)",current:"Proud (A)",mppt_state:"Režim / stav MPPT",soc:"Nabití SoC (%)",temperature:"Teplota",soh:"Zdraví SoH (%)",runtime:"Odhadovaná výdrž",time_to_full:"Doba do plného nabití",capacity:"Instalovaná kapacita",invert:"Obrátit znaménko výkonu baterie",state:"Stav měniče",load_power:"Ostrovní spotřeba — kritické zátěže (W)",name:"Název",phase_a:"Fáze L1",phase_b:"Fáze L2",phase_c:"Fáze L3",phase_a_entity:"Entita výkonu L1 (W)",phase_a_name:"Vlastní název L1 (např. Pračka)",phase_a_icon:"Ikona L1",phase_b_entity:"Entita výkonu L2 (W)",phase_b_name:"Vlastní název L2 (např. Sušička)",phase_b_icon:"Ikona L2",phase_c_entity:"Entita výkonu L3 (W)",phase_c_name:"Vlastní název L3 (např. Sporák)",phase_c_icon:"Ikona L3",power_now:"Predikovaný výkon teď (W)",remaining_today:"Zbývá dnes (kWh)",total_today:"Dnes celkem (kWh)",max_flow_w:"Výkon pro plnou rychlost animace (W)",deadband_w:"Mrtvá zóna linky (W)",dots:"Počet teček na lince",min_duration:"Nejrychlejší oběh (s)",max_duration:"Nejpomalejší oběh (s)",animation:"Animace zapnuté",yellow_from:"Žlutá od hodnoty (pod ní červená)",green_from:"Zelená od hodnoty",bar_max:"Rozsah progress baru (max)",severity_invert:"Obrátit barvy (vysoká hodnota = špatná)",grid_power:"Výkon ze sítě (W) — nepovinné, jinak součet fází",grid_energy:"Energie ze sítě (kWh)",island_power:"Výkon z ostrova (W) — budoucí Shelly",island_energy:"Energie z ostrova (kWh)"};let jt=class extends ht{constructor(){super(...arguments),this._computeLabel=t=>Nt[t.name]??t.name}setConfig(t){this._config=t}render(){if(!this.hass||!this._config)return B``;const t=this._config.floors??[];return B`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${Tt}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._mainChanged}
      ></ha-form>

      <div class="floors-header">
        <span>Patra (${t.length})</span>
        <button class="add" @click=${this._addFloor}>+ Přidat patro</button>
      </div>

      ${t.map((t,e)=>B`
          <ha-expansion-panel outlined>
            <div slot="header" class="floor-header">
              <span>${t.name||`Patro ${e+1}`}</span>
              <button
                class="remove"
                title="Odebrat patro"
                @click=${t=>{t.stopPropagation(),this._removeFloor(e)}}
              >
                ✕
              </button>
            </div>
            <div class="floor-body">
              <ha-form
                .hass=${this.hass}
                .data=${t}
                .schema=${Ht}
                .computeLabel=${this._computeLabel}
                @value-changed=${t=>this._floorChanged(t,e)}
              ></ha-form>
            </div>
          </ha-expansion-panel>
        `)}
      ${t.length?q:B`<div class="hint">
            Zatím žádná patra — přidej první přes tlačítko výše. Každé patro může mít grid větev
            (Shelly *-GRID-AC-OUT), ostrovní větev (budoucí Shelly na FVE straně) a pojmenované fáze.
          </div>`}
    `}_mainChanged(t){t.stopPropagation();const e=t.detail.value;this._emit({...e,floors:this._config?.floors??[]})}_floorChanged(t,e){t.stopPropagation();const s=[...this._config?.floors??[]];s[e]=t.detail.value,this._emit({...this._config,floors:s})}_addFloor(){const t=[...this._config?.floors??[],{name:`Patro ${(this._config?.floors?.length??0)+1}`}];this._emit({...this._config,floors:t})}_removeFloor(t){const e=(this._config?.floors??[]).filter((e,s)=>s!==t);this._emit({...this._config,floors:e})}_emit(t){this._config=t,Et(this,"config-changed",{config:t})}};jt.styles=i`
    :host {
      display: block;
    }
    ha-form {
      display: block;
      margin-bottom: 16px;
    }
    .floors-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 8px 0 12px;
      font-weight: 600;
    }
    .floors-header .add {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    ha-expansion-panel {
      display: block;
      margin-bottom: 8px;
    }
    .floor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding-right: 8px;
    }
    .floor-header .remove {
      background: transparent;
      border: 1px solid var(--divider-color, #444);
      color: var(--secondary-text-color);
      border-radius: 6px;
      padding: 2px 8px;
      cursor: pointer;
    }
    .floor-header .remove:hover {
      color: var(--error-color, #f44336);
      border-color: var(--error-color, #f44336);
    }
    .floor-body {
      padding: 12px;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      padding: 8px 4px;
    }
  `,t([yt({attribute:!1})],jt.prototype,"hass",void 0),t([$t()],jt.prototype,"_config",void 0),jt=t([dt("fve-flow-card-editor")],jt);const Rt="#00e676",It="#00e676",Dt="#4fc3f7",Ft="#e040fb",Wt="#ffb74d",Bt="#69f0ae";console.info("%c FVE-FLOW-CARD %c v0.1.0 ","color: #0a0f16; background: #00e676; font-weight: 700;","color: #00e676; background: #0a0f16; font-weight: 700;");let Vt=class extends ht{setConfig(t){if(!t)throw new Error("Chybí konfigurace");this._config=t}getCardSize(){return 12}getGridOptions(){return{columns:"full",rows:8,min_rows:4}}static async getConfigElement(){return document.createElement("fve-flow-card-editor")}static getStubConfig(){return{title:"Tok energie",pv:{power:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynosovy_vykon_fotovoltaiky",energy_today:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynos_dnes",energy_total:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_celkovy_vynos",max_power_today:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_maximalni_vykon_dnes",voltage:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_napeti_fv_sbernice",current:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_proud_dc_bateriove_sbernice",mppt_state:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_provozni_rezim_mppt"},battery:{soc:"sensor.pylontech_battery_id_512_nabijeni",power:"sensor.pylontech_battery_id_512_vykon",voltage:"sensor.pylontech_battery_id_512_napeti_dc_sbernice",current:"sensor.pylontech_battery_id_512_proud_dc_sbernice",temperature:"sensor.pylontech_battery_id_512_teplota",soh:"sensor.pylontech_battery_id_512_zdravi",runtime:"sensor.baterie_odhadovana_vydrz_2",time_to_full:"sensor.baterie_doba_do_plneho_nabiti",capacity:"sensor.pylontech_battery_id_512_instalovana_kapacita"},inverter:{power:"sensor.multiplus_ii_48_5000_70_50_id_275_vystupni_vykon_l1",state:"sensor.multiplus_ii_48_5000_70_50_id_275_stav",load_power:"sensor.gx_device_kriticke_zateze_na_l1",name:"MultiPlus-II"},grid:{power:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_vykon",phase_a:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_a_vykon",phase_b:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_b_vykon",phase_c:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_c_vykon",energy_total:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_in_energie",name:"Síť ČEZ"},solcast:{power_now:"sensor.solcast_pv_forecast_power_now",remaining_today:"sensor.solcast_pv_forecast_forecast_remaining_today",total_today:"sensor.solcast_pv_forecast_forecast_today"},floors:[{name:"0NP",grid_energy:"sensor.0np_pradelna_dub_0np_grid_ac_out_energie",phase_a_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_a_vykon",phase_b_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_b_vykon",phase_c_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_c_vykon"},{name:"1NP",grid_energy:"sensor.dub_1np_grid_ac_out_energie",phase_a_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_a_vykon",phase_b_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_b_vykon",phase_c_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_c_vykon"}]}}_flowBase(){const t=this._config?.options??{};return{deadband:t.deadband_w??25,maxPower:t.max_flow_w??5e3,minDuration:t.min_duration??1.4,maxDuration:t.max_duration??6,dots:t.dots??3,animate:!1!==t.animation}}_open(t){!function(t,e){e&&Et(t,"hass-more-info",{entityId:e})}(this,t)}_phases(t){const e=[],s=[[t.phase_a_entity,t.phase_a_name,t.phase_a_icon,"L1"],[t.phase_b_entity,t.phase_b_name,t.phase_b_icon,"L2"],[t.phase_c_entity,t.phase_c_name,t.phase_c_icon,"L3"]];for(const[t,o,r,n]of s)t&&e.push({entity:t,name:o||n,icon:r||"mdi:flash",label:n});return e}_floorGridPower(t){return t.grid_power&&xt(this.hass,t.grid_power)?ft(this.hass,t.grid_power):this._phases(t).reduce((t,e)=>t+ft(this.hass,e.entity),0)}render(){const t=this._config;if(!t)return B``;if(!this.hass)return B`<ha-card></ha-card>`;const e=t.floors??[],s=function(t){const e=Math.max(1,t),s={x:50,y:40,w:300,h:190},o={x:50,y:280,w:300,h:130},r={x:50,y:480,w:300,h:300},n={x:590,y:360,w:280,h:170},i={x:590,y:40,w:280,h:190},a={x:1020,y:40,w:310,h:150},l=[];for(let t=0;t<e;t++)l.push({x:1020,y:210+200*t,w:310,h:170});const h=l[l.length-1].y+170,c=s.x+s.w/2,d=n.y+n.h/2,p=a.y+a.h/2,_={pvMppt:`M ${c} ${s.y+s.h} L ${c} ${o.y}`,pvSolcast:`M ${s.x+s.w} ${s.y+s.h/2} H ${i.x}`,mpptInv:`M ${o.x+o.w} ${o.y+o.h/2} H 460 V ${n.y+50} H ${n.x}`,batInv:`M ${r.x+r.w} ${r.y+150} H 520 V ${n.y+120} H ${n.x}`,islandTaps:l.map(t=>{const e=t.y+t.h/2;return`M ${n.x+n.w} ${d} H 950 V ${e} H ${t.x}`}),gridTaps:l.map(t=>{const e=t.y+t.h/2;return`M ${a.x+a.w} ${p} H 1388 V ${e} H ${t.x+t.w}`})};return{width:1440,height:Math.max(820,h+40),pv:s,mppt:o,battery:r,inverter:n,solcast:i,grid:a,floors:l,paths:_}}(Math.max(1,e.length)),o=this._flowBase(),r=ft(this.hass,t.pv?.power),n=ft(this.hass,t.battery?.power),i=t.battery?.invert?-n:n,a=i>=o.deadband,l=i<=-o.deadband,h=xt(this.hass,t.inverter?.load_power)?ft(this.hass,t.inverter?.load_power):ft(this.hass,t.inverter?.power),c=xt(this.hass,t.grid?.power)?ft(this.hass,t.grid?.power):e.reduce((t,e)=>t+this._floorGridPower(e),0),d=(t,e,s)=>St(t,e,{...o,reverse:!1,hidden:!1,...s});return B`
      <ha-card>
        <svg
          viewBox="0 0 ${s.width} ${s.height}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
        >
          ${t.title?V`<text class="card-title" x="${s.width/2}" y="26" text-anchor="middle">${t.title}</text>`:q}

          <!-- Toky (pod uzly) -->
          ${t.solcast?.power_now||t.solcast?.remaining_today||t.solcast?.total_today?V`<path d="${s.paths.pvSolcast}" fill="none" stroke="#ffd54f"
                stroke-opacity="0.3" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round"/>`:q}
          ${d("pv-mppt",s.paths.pvMppt,{power:r,color:Rt,hidden:!t.pv?.power})}
          ${d("mppt-inv",s.paths.mpptInv,{power:r,color:Rt,hidden:!t.pv?.power})}
          ${d("bat-inv",s.paths.batInv,{power:i,color:a?Ft:Wt,reverse:a,hidden:!t.battery?.power})}
          ${s.paths.islandTaps.map((t,s)=>{const o=e[s],r=o?.island_power&&xt(this.hass,o.island_power)?ft(this.hass,o.island_power):h;return d(`island-${s}`,t,{power:r,color:It})})}
          ${s.paths.gridTaps.map((t,s)=>{const o=e[s];return d(`grid-${s}`,t,{power:o?this._floorGridPower(o):0,color:Dt})})}

          <!-- Uzly -->
          ${this._nodePv(s.pv)}
          ${this._nodeMppt(s.mppt)}
          ${this._nodeBattery(s.battery,i,a,l)}
          ${this._nodeInverter(s.inverter,h)}
          ${this._nodeSolcast(s.solcast)}
          ${this._nodeGrid(s.grid,c)}
          ${s.floors.map((t,s)=>e[s]?this._nodeFloor(t,e[s]):q)}
        </svg>
      </ha-card>
    `}_panel(t,e,s=!0){return V`
      <rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="18"
        fill="rgba(14, 24, 34, 0.72)"
        stroke="${e}" stroke-opacity="${s?.5:.18}" stroke-width="1.5"
        style="${s?`filter: drop-shadow(0 0 10px ${e}40)`:""}"/>`}_bar(t,e,s,o){const r=t.w-40,n=Math.max(0,Math.min(1,Math.abs(e)/Math.max(1,s)));return V`
      <rect x="${t.x+20}" y="${t.y+t.h-12}" width="${r}" height="4" rx="2"
        fill="rgba(255,255,255,0.08)"/>
      <rect x="${t.x+20}" y="${t.y+t.h-12}" width="${Math.max(4,r*n)}" height="4" rx="2"
        fill="${o}" style="filter: drop-shadow(0 0 4px ${o})"/>`}_hit(t,e){return e?V`
      <rect class="hit" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="18"
        fill="transparent" @click=${()=>this._open(e)}>
        <title>Zobrazit historii</title>
      </rect>`:q}_nodePv(t){const e=this._config?.pv??{},s=ft(this.hass,e.power),o=Math.abs(s)>=this._flowBase().deadband,r=ut(s,e),n=r??Rt;return V`
      ${this._panel(t,n,o)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">FVE panely</text>
      ${function(t,e,s,o){return V`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <path d="M14 8 L58 8 L50 44 L6 44 Z"/>
      <line x1="28" y1="8" x2="21" y2="44"/>
      <line x1="43" y1="8" x2="36" y2="44"/>
      <line x1="11" y1="26" x2="54" y2="26"/>
      <line x1="28" y1="44" x2="28" y2="56"/>
      <line x1="18" y1="56" x2="38" y2="56"/>
    </g>`}(t.x+18,t.y+46,60,o?n:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+92}" y="${t.y+84}" style="fill: ${n}">${e.power?wt(s):"—"}</text>
      ${r?this._bar(t,s,e.bar_max??this._flowBase().maxPower,r):q}
      <text class="small" x="${t.x+92}" y="${t.y+112}">
        Dnes <tspan class="strong">${e.energy_today?kt(ft(this.hass,e.energy_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+92}" y="${t.y+134}">
        Celkem <tspan class="strong">${e.energy_total?kt(ft(this.hass,e.energy_total)):"—"}</tspan>
      </text>
      <text class="tiny" x="${t.x+92}" y="${t.y+156}">
        ${e.max_power_today?`špička dnes ${wt(ft(this.hass,e.max_power_today))}`:""}
      </text>
      ${this._hit(t,e.power)}
    `}_nodeMppt(t){const e=this._config?.pv??{},s=At(this.hass,e.mppt_state);return V`
      ${this._panel(t,Rt,"—"!==s)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">MPPT regulátor</text>
      ${function(t,e,s,o){return V`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <rect x="8" y="12" width="48" height="40" rx="6"/>
      <path d="M16 40 L26 40 L32 24 L38 40 L48 40"/>
      <line x1="24" y1="52" x2="24" y2="58"/>
      <line x1="40" y1="52" x2="40" y2="58"/>
    </g>`}(t.x+18,t.y+44,48,Rt)}
      <text class="medium" x="${t.x+80}" y="${t.y+66}">${s}</text>
      <text class="small" x="${t.x+80}" y="${t.y+92}">
        ${e.voltage?At(this.hass,e.voltage):"—"} ·
        ${e.current?At(this.hass,e.current):"—"}
      </text>
      <text class="tiny" x="${t.x+20}" y="${t.y+116}">FV sběrnice → DC</text>
      ${this._hit(t,e.mppt_state??e.voltage)}
    `}_nodeBattery(t,e,s,o){const r=this._config?.battery??{},n=ft(this.hass,r.soc,0),i=ut(n,{yellow_from:r.yellow_from??15,green_from:r.green_from??40,severity_invert:r.severity_invert}),a=s?`▲ nabíjení ${wt(Math.abs(e))}`:o?`▼ vybíjení ${wt(Math.abs(e))}`:"● klidový stav",l=s?Ft:o?Wt:"rgba(220,235,245,0.55)";return V`
      ${this._panel(t,i,!0)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">Baterie Pylontech</text>
      ${function(t,e,s,o,r,n){const i=.4*s,a=o-12,l=Math.max(0,Math.min(1,r/100))*a;return V`
    <g style="filter: drop-shadow(0 0 6px ${n})">
      <rect x="${t+(s-i)/2}" y="${e-10}" width="${i}" height="${14}" rx="3"
        fill="none" stroke="${n}" stroke-width="3"/>
      <rect x="${t}" y="${e}" width="${s}" height="${o}" rx="10"
        fill="rgba(0,0,0,0.35)" stroke="${n}" stroke-width="3"/>
      <rect x="${t+6}" y="${e+6+(a-l)}" width="${s-12}" height="${l}" rx="5"
        fill="${n}" opacity="0.85"/>
    </g>`}(t.x+30,t.y+62,58,168,n,i)}
      <text class="tiny" x="${t.x+59}" y="${t.y+252}" text-anchor="middle">
        ${r.capacity?At(this.hass,r.capacity):""}
      </text>
      <text class="big" x="${t.x+118}" y="${t.y+90}" style="fill: ${i}">${r.soc?`${Math.round(n)} %`:"—"}</text>
      <text class="medium" x="${t.x+118}" y="${t.y+122}" style="fill: ${l}">${r.power?a:""}</text>
      <text class="small" x="${t.x+118}" y="${t.y+152}">
        ${r.voltage?At(this.hass,r.voltage):"—"} ·
        ${r.current?At(this.hass,r.current):"—"}
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+176}">
        ${r.temperature?At(this.hass,r.temperature):"—"}
        ${r.soh?` · SoH ${At(this.hass,r.soh)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+204}">
        ${r.runtime?`Výdrž ${At(this.hass,r.runtime)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+226}">
        ${s&&r.time_to_full?`Do nabití ${At(this.hass,r.time_to_full)}`:""}
      </text>
      ${this._hit(t,r.soc)}
    `}_nodeInverter(t,e){const s=this._config?.inverter??{},o=xt(this.hass,s.power)?ft(this.hass,s.power):e,r=At(this.hass,s.state),n=Math.abs(o)>=this._flowBase().deadband||"—"!==r,i=ut(o,s),a=i??It;return V`
      ${this._panel(t,a,n)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">Měnič ${s.name??"MultiPlus-II"}</text>
      ${function(t,e,s,o){return V`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <rect x="6" y="6" width="52" height="52" rx="10"/>
      <path d="M20 26 A 14 14 0 0 1 44 26" />
      <path d="M44 26 l 1 -8 m -1 8 l -8 -1"/>
      <path d="M44 38 A 14 14 0 0 1 20 38" />
      <path d="M20 38 l -1 8 m 1 -8 l 8 1"/>
    </g>`}(t.x+18,t.y+46,56,n?a:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${a}">${wt(o)}</text>
      ${i?this._bar(t,o,s.bar_max??this._flowBase().maxPower,i):q}
      <circle cx="${t.x+96}" cy="${t.y+106}" r="4" fill="${"—"!==r?Bt:"rgba(148,170,190,0.4)"}"/>
      <text class="small" x="${t.x+108}" y="${t.y+111}">${r}</text>
      <text class="tiny" x="${t.x+20}" y="${t.y+146}">
        ${s.load_power&&s.power?`Kritické zátěže ${wt(ft(this.hass,s.load_power))}`:"Ostrovní spotřeba"}
      </text>
      ${this._hit(t,s.power??s.load_power)}
    `}_nodeSolcast(t){const e=this._config?.solcast;return e&&(e.power_now||e.remaining_today||e.total_today)?V`
      ${this._panel(t,"#ffd54f",!0)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">Předpověď Solcast</text>
      ${function(t,e,s,o){return V`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <circle cx="32" cy="32" r="12"/>
      <line x1="32" y1="6"  x2="32" y2="14"/>
      <line x1="32" y1="50" x2="32" y2="58"/>
      <line x1="6"  y1="32" x2="14" y2="32"/>
      <line x1="50" y1="32" x2="58" y2="32"/>
      <line x1="13" y1="13" x2="19" y2="19"/>
      <line x1="45" y1="45" x2="51" y2="51"/>
      <line x1="13" y1="51" x2="19" y2="45"/>
      <line x1="45" y1="19" x2="51" y2="13"/>
    </g>`}(t.x+16,t.y+58,56,"#ffd54f")}
      <text class="medium" x="${t.x+88}" y="${t.y+84}" fill="#ffd54f">
        ${e.power_now?wt(ft(this.hass,e.power_now)):"—"}
      </text>
      <text class="small" x="${t.x+88}" y="${t.y+116}">
        Zbývá dnes <tspan class="strong">${e.remaining_today?kt(ft(this.hass,e.remaining_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+88}" y="${t.y+142}">
        Dnes celkem <tspan class="strong">${e.total_today?kt(ft(this.hass,e.total_today)):"—"}</tspan>
      </text>
      ${this._hit(t,e.power_now)}
    `:q}_nodeGrid(t,e){const s=this._config?.grid??{},o=Math.abs(e)>=this._flowBase().deadband,r=[s.phase_a,s.phase_b,s.phase_c].map((t,e)=>t?`L${e+1} ${wt(ft(this.hass,t))}`:null).filter(Boolean).join(" · "),n=ut(e,s),i=n??Dt;return V`
      ${this._panel(t,i,o)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${s.name??"Síť ČEZ"} · AC-IN</text>
      ${function(t,e,s,o){return V`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${o}" fill="none"
       stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <path d="M22 58 L28 12 L36 12 L42 58"/>
      <line x1="14" y1="20" x2="50" y2="20"/>
      <line x1="10" y1="32" x2="54" y2="32"/>
      <line x1="27" y1="20" x2="37" y2="32"/>
      <line x1="37" y1="20" x2="27" y2="32"/>
      <line x1="14" y1="20" x2="18" y2="28"/>
      <line x1="50" y1="20" x2="46" y2="28"/>
      <line x1="25" y1="44" x2="39" y2="44"/>
      <line x1="25" y1="44" x2="34" y2="58"/>
      <line x1="39" y1="44" x2="30" y2="58"/>
    </g>`}(t.x+16,t.y+40,58,o?i:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+82}" style="fill: ${i}">${wt(e)}</text>
      ${n?this._bar(t,e,s.bar_max??this._flowBase().maxPower,n):q}
      <text class="tiny" x="${t.x+90}" y="${t.y+106}">${r}</text>
      <text class="tiny" x="${t.x+90}" y="${t.y+128}">
        ${s.energy_total?`Celkem ${kt(ft(this.hass,s.energy_total))}`:""}
        ${s.energy_today?` · dnes ${kt(ft(this.hass,s.energy_today))}`:""}
      </text>
      ${this._hit(t,s.power)}
    `}_nodeFloor(t,e){const s=this._floorGridPower(e),o=!!e.island_power&&xt(this.hass,e.island_power),r=o?ft(this.hass,e.island_power):0,n=this._phases(e),i=Math.abs(s)>=this._flowBase().deadband||o&&Math.abs(r)>=this._flowBase().deadband,a=o&&r>s?It:Dt;return V`
      ${this._panel(t,a,i)}
      ${function(t,e,s,o){return V`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <path d="M8 32 L32 10 L56 32"/>
      <path d="M14 28 L14 56 L50 56 L50 28"/>
      <path d="M26 56 L26 40 L38 40 L38 56"/>
    </g>`}(t.x+16,t.y+12,30,a)}
      <text class="floor-name" x="${t.x+54}" y="${t.y+34}">${e.name??"Patro"}</text>
      <text class="tiny" x="${t.x+54}" y="${t.y+56}">
        ${e.grid_energy?`ze sítě ${kt(ft(this.hass,e.grid_energy))}`:""}
        ${e.island_energy?` · z ostrova ${kt(ft(this.hass,e.island_energy))}`:""}
      </text>
      ${o?V`
          <text class="floor-val" x="${t.x+t.w-20}" y="${t.y+32}" text-anchor="end">
            <tspan class="dim">ostrov </tspan><tspan class="val-island strong">${wt(r)}</tspan>
          </text>
          <text class="floor-val" x="${t.x+t.w-20}" y="${t.y+56}" text-anchor="end">
            <tspan class="dim">síť </tspan><tspan class="val-grid strong">${wt(s)}</tspan>
          </text>`:V`
          <text class="floor-val" x="${t.x+t.w-20}" y="${t.y+32}" text-anchor="end">
            <tspan class="dim">síť </tspan><tspan class="val-grid strong">${wt(s)}</tspan>
          </text>`}
      ${n.length?V`
          <foreignObject x="${t.x+14}" y="${t.y+t.h-88}" width="${t.w-28}" height="76">
            ${B`
              <div class="chips" xmlns="http://www.w3.org/1999/xhtml">
                ${n.map(t=>B`
                    <div
                      class="chip"
                      title=${`${t.label} · ${t.name}`}
                      @click=${e=>{e.stopPropagation(),this._open(t.entity)}}
                    >
                      <ha-icon .icon=${t.icon}></ha-icon>
                      <span class="chip-value">${wt(ft(this.hass,t.entity))}</span>
                      <span class="chip-name">${t.name}</span>
                    </div>
                  `)}
              </div>
            `}
          </foreignObject>`:q}
      ${this._hit({x:t.x,y:t.y,w:t.w,h:64},e.grid_power??e.island_power??n[0]?.entity)}
    `}};Vt.styles=i`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      height: 100%;
      overflow: hidden;
      padding: 4px;
      background:
        radial-gradient(1100px 700px at 18% -10%, #122433 0%, transparent 60%),
        radial-gradient(900px 600px at 95% 105%, #0d1d2e 0%, transparent 55%),
        linear-gradient(160deg, #0b141d 0%, #070c12 100%);
      border: 1px solid rgba(120, 180, 210, 0.08);
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      font-family: var(--paper-font-body1_-_font-family, 'Roboto', 'Segoe UI', sans-serif);
    }
    text {
      fill: rgba(226, 240, 248, 0.92);
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.4);
    }
    .node-title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.45);
    }
    .big {
      font-size: 32px;
      font-weight: 700;
    }
    .medium {
      font-size: 17px;
      font-weight: 600;
    }
    .small {
      font-size: 14px;
      fill: rgba(226, 240, 248, 0.62);
    }
    .tiny {
      font-size: 11.5px;
      fill: rgba(226, 240, 248, 0.45);
    }
    .strong {
      font-weight: 700;
      fill: rgba(226, 240, 248, 0.92);
    }
    .dim {
      fill: rgba(226, 240, 248, 0.45);
    }
    .floor-name {
      font-size: 20px;
      font-weight: 700;
    }
    .floor-val {
      font-size: 15px;
    }
    .val-island {
      fill: #00e676;
    }
    .val-island.strong {
      fill: #00e676;
    }
    .val-grid {
      fill: #4fc3f7;
    }
    .val-grid.strong {
      fill: #4fc3f7;
    }
    .hit {
      cursor: pointer;
    }
    .hit:hover {
      fill: rgba(255, 255, 255, 0.04);
    }
    .chips {
      display: flex;
      gap: 8px;
      height: 100%;
      box-sizing: border-box;
    }
    .chip {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(120, 180, 210, 0.16);
      border-radius: 12px;
      cursor: pointer;
      padding: 4px 2px;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .chip:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: rgba(79, 195, 247, 0.55);
    }
    .chip ha-icon {
      --mdc-icon-size: 18px;
      color: rgba(226, 240, 248, 0.75);
    }
    .chip-value {
      font-size: 13px;
      font-weight: 700;
      color: #4fc3f7;
      line-height: 1.1;
    }
    .chip-name {
      font-size: 10px;
      color: rgba(226, 240, 248, 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.1;
    }
  `,t([yt({attribute:!1})],Vt.prototype,"hass",void 0),t([$t()],Vt.prototype,"_config",void 0),Vt=t([dt("fve-flow-card")],Vt),window.customCards=window.customCards||[],window.customCards.push({type:"fve-flow-card",name:"FVE Flow Card",description:"Animovaný diagram toků energie pro ostrovní FVE (Victron) + grid po patrech (Shelly), se Solcast predikcí.",preview:!1,documentationURL:"https://github.com/elvisek/fve-flow-card"});export{Vt as FveFlowCard};
