function lib(e = undefined) {
    let event = [];
    if (e !== undefined) {
        e[0] === '#'
            ? event.push(document.getElementById(e.split('#')[1]))
            : e[0] === '.'
                ? (event = Array.from(
                    document.getElementsByClassName(e.split('.')[1])
                ))
                : e instanceof HTMLElement
                    ? event.push(e)
                    : e.includes('[') && e.includes(']')
                        ? (event = Array.from(document.querySelectorAll(e)))
                        : (event = Array.from(document.getElementsByTagName(e)));
        event.length === 0 ? console.log('Element is undefined') : null;
        event = event.filter(checkNull);
        return {
            click: function (f = undefined) {
                for (let index = 0; index < event.length; index++) {
                    if (f === undefined) {
                        event[index].click();
                    } else {
                        event[index].addEventListener('click', () => {
                            f(event[index]);
                        });
                    }
                }
            },
            input: function (f = undefined) {
                for (let index = 0; index < event.length; index++) {
                    if (f === undefined) {
                        return event[index];
                    } else {
                        event[index].addEventListener('input', () => {
                            f(event[index]);
                        });
                    }
                }
            },
            content: function (f = undefined) {
                for (let index = 0; index < event.length; index++) {
                    if (f === undefined) {
                        return event[index].content;
                    }
                }
            },
            textContent: function (f = undefined) {
                for (let index = 0; index < event.length; index++) {
                    if (f === undefined) {
                        return event[index].textContent;
                    }
                }
            },
            value: function (f) {
                for (let index = 0; index < event.length; index++) {
                    return event[index].value;
                }
            },
            checked: function (f) {
                for (let index = 0; index < event.length; index++) {
                    return event[index].checked;
                }
            },
            html: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].innerHTML = f;
                }
            },
            text: function (f) {
                for (let index = 0; index < event.length; index++) {
                    return event[index].innerText;
                }
            },
            appChild: function (f = undefined) {
                for (let index = 0; index < event.length; index++) {
                    event[index].appendChild(f);
                }
            },
            setValue: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].value = f;
                }
            },
            attr: function (f, e = undefined) {
                for (let index = 0; index < event.length; index++) {
                    if (e === undefined) {
                        return event[index].getAttribute(f);
                    } else {
                        event[index].setAttribute(f, e);
                    }
                }
            },
            removeAttr: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].removeAttribute(f);
                }
            },
            removeClass: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].classList.remove(f);
                }
            },
            addClass: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].classList.add(f);
                }
            },
            change: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].addEventListener('change', (e) => {
                        f(event[index].value);
                    });
                }
            },
            on: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].addEventListener('change', (e) => {
                        f(e);
                    });
                }
            },
            submit: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].submit();
                }
            },
            submitDetect: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].addEventListener('submit', (e) => {
                        f(e);
                    });
                }
            },
            focus: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].addEventListener('focus', (e) => {
                        f(e);
                    });
                }
            },
            onMouseOver: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].addEventListener('mouseover', (e) => {
                        f(e);
                    });
                }
            },
            onMouseOut: function (f) {
                for (let index = 0; index < event.length; index++) {
                    event[index].addEventListener('mouseout', (e) => {
                        f(e);
                    });
                }
            },
            el: function (f) {
                if (event.length === 1) {
                    return e[0] === '#' ? event[0] : event;
                } else {
                    let elArray = [];
                    for (let index = 0; index < event.length; index++) {
                        elArray.push(event[index]);
                    }
                    return elArray;
                }
            }
        };
    }
}

function checkNull(f) {
    return f === null ? console.log('Element is undefined', f) : f;
}
