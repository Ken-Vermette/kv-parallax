/** 
 * 
 * KV Parallax
 * @link    http://kver.ca
 * @author  Ken Vermette <vermette@gmail.com>
 * @version 1.0.0
 * @licence GNU Lesser General Public License v2.1
 * 
 */

var kvParallax = {};

(function(kvp)
{
	Object.assign(kvp, {
		observer: null,
		elementList: [],
		scrollTimer: null,
		dirty: true,
		options: {
			className: 'css-parallax',
			cssPrefix: 'parallax-',
			decimalAccuracy: 3,
		},
		envParams: {
			'scroll-x':         (e, el) => { return e.xScrollProgress; },
			'scroll-y':         (e, el) => { return e.yScrollProgress; },
			'coverage-x':       (e, el) => { return e.xCoverage; },
			'coverage-y':       (e, el) => { return e.yCoverage; },
			'visible':          (e, el) => { return e.xCoverage > 0 && e.yCoverage > 0 ? 1 : 0; },
			'half-visible':     (e, el) => { return e.xCoverage >= 0.5 && e.yCoverage >= 0.5 ? 1 : 0; },
			'quarter-visible':  (e, el) => { return e.xCoverage >= 0.25 && e.yCoverage >= 0.25 ? 1 : 0; },
			'cubic-x': (e, el) => { 
				var t = e.xCoverage;
				return (t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1); 
			},
			'cubic-y': (e, el) => { 
				var t = e.yCoverage;
				return (t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1); 
			},
		},
		
		init: (o) => {
			Object.assign(kvp.options, o);
			
			document.addEventListener('scroll', () => {
				kvp.dirty = true;
			});
			
			window.addEventListener('resize', () => {
				kvp.dirty = true;
			});
			
			kvp.elementList = Array.prototype.slice.call(document.querySelectorAll('.' + kvp.options.className));
			kvp.observer = new MutationObserver(kvp.domMutation);
			kvp.observer.observe(document.documentElement, { 
				attributes: true, 
				childList: true,
				subtree: true
			});
			
			kvp.update();
		},
		
		markDirty: () => {
			kvp.dirty = true;
		},
		
		addCssVariable: (name, callback) => {
			kvp.envParams = callback;
		},
		
		domMutation: (m, ob) => {
			m.forEach(function(e) {
				if (e.type === 'childList') {
					kvp.elementList = kvp.elementList.filter((el) => {
						return Array.prototype.slice.call(e.removedNodes).indexOf( el ) < 0;
					});
					
					e.addedNodes.forEach((el) => {
						if (el.classList.contains(kvp.options.className)) {
							kvp.elementList.push(el);
						}
					});
				}
				else if (e.type === 'attributes' && e.attributeName == 'class') {
					if (e.target.classList.contains(kvp.options.className) && !kvp.elementList.includes(e.target)) {
						kvp.elementList.push(e.target);
					}
					else if (!e.target.classList.contains(kvp.options.className) && kvp.elementList.includes(e.target)) {
						kvp.elementList.splice(kvp.elementList.indexOf(e.target), 1);
					}
				}
			});
		},
		
		update: () => {
			if (kvp.dirty) {
				kvp.dirty = false;
				let docEl = document.documentElement;
				
				// First we get all the element information.
				kvp.elementList.forEach((el) => {
					let rect  = el.getBoundingClientRect();
					let xCoverage = -Math.min(0, Math.max(0,rect.left) - Math.min(docEl.clientWidth,rect.right)) / docEl.clientWidth;
					let yCoverage = -Math.min(0, Math.max(0,rect.top) - Math.min(docEl.clientHeight,rect.bottom)) / docEl.clientHeight;
					
					// If we don't see see any of the element, and that element is up-to-date, don't update it further.
					if (xCoverage + yCoverage == 0 && el.kvParallaxData.xCoverage + el.kvParallaxData.yCoverage == 0) {
						return; 
					}
					
					let minY  = el.offsetTop - docEl.clientHeight;
					let minX  = el.offsetLeft - docEl.clientWidth;
					
					el.kvParallaxData = {
						xScrollProgress: Math.min(1, Math.max(0, docEl.scrollLeft - minX) / (el.offsetWidth - minX)),
						yScrollProgress: Math.min(1, Math.max(0, docEl.scrollTop - minY) / (el.offsetHeight - minY)),
						xCoverage: xCoverage,
						yCoverage: yCoverage,
					};
				});
				// Then we apply the properties. We split the work up to avoid reflow jank.
				kvp.elementList.forEach((el) => {
					for (const [prop, call] of Object.entries(kvp.envParams)) {
						el.style.setProperty('--' + kvp.options.cssPrefix + prop, call(el.kvParallaxData, el).toFixed(kvp.options.decimalAccuracy));
					}
				});
			}
			
			window.requestAnimationFrame(kvp.update);
		}
	});
}(kvParallax));

document.addEventListener('DOMContentLoaded', () => {
	kvParallax.init({});
});