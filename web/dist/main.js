(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all2) => {
    for (var name in all2)
      __defProp(target, name, { get: all2[name], enumerable: true });
  };

  // web/src/bridge.js
  function navigateHome() {
    pycmd("foggy:home");
  }
  function sendRunRequest(request) {
    pycmd("foggy:run:" + JSON.stringify(request));
  }
  function answerCard(ease) {
    pycmd("foggy:answer:" + ease);
  }
  function registerResultHandler(handler) {
    window.foggyReceiveResults = handler;
  }

  // node_modules/mdast-util-to-string/lib/index.js
  var emptyOptions = {};
  function toString(value, options) {
    const settings = options || emptyOptions;
    const includeImageAlt = typeof settings.includeImageAlt === "boolean" ? settings.includeImageAlt : true;
    const includeHtml = typeof settings.includeHtml === "boolean" ? settings.includeHtml : true;
    return one(value, includeImageAlt, includeHtml);
  }
  function one(value, includeImageAlt, includeHtml) {
    if (node(value)) {
      if ("value" in value) {
        return value.type === "html" && !includeHtml ? "" : value.value;
      }
      if (includeImageAlt && "alt" in value && value.alt) {
        return value.alt;
      }
      if ("children" in value) {
        return all(value.children, includeImageAlt, includeHtml);
      }
    }
    if (Array.isArray(value)) {
      return all(value, includeImageAlt, includeHtml);
    }
    return "";
  }
  function all(values, includeImageAlt, includeHtml) {
    const result = [];
    let index2 = -1;
    while (++index2 < values.length) {
      result[index2] = one(values[index2], includeImageAlt, includeHtml);
    }
    return result.join("");
  }
  function node(value) {
    return Boolean(value && typeof value === "object");
  }

  // node_modules/decode-named-character-reference/index.dom.js
  var element = document.createElement("i");
  function decodeNamedCharacterReference(value) {
    const characterReference2 = "&" + value + ";";
    element.innerHTML = characterReference2;
    const character = element.textContent;
    if (character.charCodeAt(character.length - 1) === 59 && value !== "semi") {
      return false;
    }
    return character === characterReference2 ? false : character;
  }

  // node_modules/micromark-util-chunked/index.js
  function splice(list2, start, remove, items) {
    const end = list2.length;
    let chunkStart = 0;
    let parameters;
    if (start < 0) {
      start = -start > end ? 0 : end + start;
    } else {
      start = start > end ? end : start;
    }
    remove = remove > 0 ? remove : 0;
    if (items.length < 1e4) {
      parameters = Array.from(items);
      parameters.unshift(start, remove);
      list2.splice(...parameters);
    } else {
      if (remove)
        list2.splice(start, remove);
      while (chunkStart < items.length) {
        parameters = items.slice(chunkStart, chunkStart + 1e4);
        parameters.unshift(start, 0);
        list2.splice(...parameters);
        chunkStart += 1e4;
        start += 1e4;
      }
    }
  }
  function push(list2, items) {
    if (list2.length > 0) {
      splice(list2, list2.length, 0, items);
      return list2;
    }
    return items;
  }

  // node_modules/micromark-util-combine-extensions/index.js
  var hasOwnProperty = {}.hasOwnProperty;
  function combineExtensions(extensions) {
    const all2 = {};
    let index2 = -1;
    while (++index2 < extensions.length) {
      syntaxExtension(all2, extensions[index2]);
    }
    return all2;
  }
  function syntaxExtension(all2, extension2) {
    let hook;
    for (hook in extension2) {
      const maybe = hasOwnProperty.call(all2, hook) ? all2[hook] : void 0;
      const left = maybe || (all2[hook] = {});
      const right = extension2[hook];
      let code;
      if (right) {
        for (code in right) {
          if (!hasOwnProperty.call(left, code))
            left[code] = [];
          const value = right[code];
          constructs(
            // @ts-expect-error Looks like a list.
            left[code],
            Array.isArray(value) ? value : value ? [value] : []
          );
        }
      }
    }
  }
  function constructs(existing, list2) {
    let index2 = -1;
    const before = [];
    while (++index2 < list2.length) {
      ;
      (list2[index2].add === "after" ? existing : before).push(list2[index2]);
    }
    splice(existing, 0, 0, before);
  }

  // node_modules/micromark-util-decode-numeric-character-reference/index.js
  function decodeNumericCharacterReference(value, base) {
    const code = Number.parseInt(value, base);
    if (
      // C0 except for HT, LF, FF, CR, space.
      code < 9 || code === 11 || code > 13 && code < 32 || // Control character (DEL) of C0, and C1 controls.
      code > 126 && code < 160 || // Lone high surrogates and low surrogates.
      code > 55295 && code < 57344 || // Noncharacters.
      code > 64975 && code < 65008 || /* eslint-disable no-bitwise */
      (code & 65535) === 65535 || (code & 65535) === 65534 || /* eslint-enable no-bitwise */
      // Out of range
      code > 1114111
    ) {
      return "\uFFFD";
    }
    return String.fromCodePoint(code);
  }

  // node_modules/micromark-util-normalize-identifier/index.js
  function normalizeIdentifier(value) {
    return value.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
  }

  // node_modules/micromark-util-character/index.js
  var asciiAlpha = regexCheck(/[A-Za-z]/);
  var asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);
  var asciiAtext = regexCheck(/[#-'*+\--9=?A-Z^-~]/);
  function asciiControl(code) {
    return (
      // Special whitespace codes (which have negative values), C0 and Control
      // character DEL
      code !== null && (code < 32 || code === 127)
    );
  }
  var asciiDigit = regexCheck(/\d/);
  var asciiHexDigit = regexCheck(/[\dA-Fa-f]/);
  var asciiPunctuation = regexCheck(/[!-/:-@[-`{-~]/);
  function markdownLineEnding(code) {
    return code !== null && code < -2;
  }
  function markdownLineEndingOrSpace(code) {
    return code !== null && (code < 0 || code === 32);
  }
  function markdownSpace(code) {
    return code === -2 || code === -1 || code === 32;
  }
  var unicodePunctuation = regexCheck(/\p{P}|\p{S}/u);
  var unicodeWhitespace = regexCheck(/\s/);
  function regexCheck(regex) {
    return check;
    function check(code) {
      return code !== null && code > -1 && regex.test(String.fromCharCode(code));
    }
  }

  // node_modules/micromark-factory-space/index.js
  function factorySpace(effects, ok, type, max) {
    const limit = max ? max - 1 : Number.POSITIVE_INFINITY;
    let size = 0;
    return start;
    function start(code) {
      if (markdownSpace(code)) {
        effects.enter(type);
        return prefix(code);
      }
      return ok(code);
    }
    function prefix(code) {
      if (markdownSpace(code) && size++ < limit) {
        effects.consume(code);
        return prefix;
      }
      effects.exit(type);
      return ok(code);
    }
  }

  // node_modules/micromark/lib/initialize/content.js
  var content = {
    tokenize: initializeContent
  };
  function initializeContent(effects) {
    const contentStart = effects.attempt(this.parser.constructs.contentInitial, afterContentStartConstruct, paragraphInitial);
    let previous2;
    return contentStart;
    function afterContentStartConstruct(code) {
      if (code === null) {
        effects.consume(code);
        return;
      }
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return factorySpace(effects, contentStart, "linePrefix");
    }
    function paragraphInitial(code) {
      effects.enter("paragraph");
      return lineStart(code);
    }
    function lineStart(code) {
      const token = effects.enter("chunkText", {
        contentType: "text",
        previous: previous2
      });
      if (previous2) {
        previous2.next = token;
      }
      previous2 = token;
      return data(code);
    }
    function data(code) {
      if (code === null) {
        effects.exit("chunkText");
        effects.exit("paragraph");
        effects.consume(code);
        return;
      }
      if (markdownLineEnding(code)) {
        effects.consume(code);
        effects.exit("chunkText");
        return lineStart;
      }
      effects.consume(code);
      return data;
    }
  }

  // node_modules/micromark/lib/initialize/document.js
  var document2 = {
    tokenize: initializeDocument
  };
  var containerConstruct = {
    tokenize: tokenizeContainer
  };
  function initializeDocument(effects) {
    const self = this;
    const stack = [];
    let continued = 0;
    let childFlow;
    let childToken;
    let lineStartOffset;
    return start;
    function start(code) {
      if (continued < stack.length) {
        const item = stack[continued];
        self.containerState = item[1];
        return effects.attempt(item[0].continuation, documentContinue, checkNewContainers)(code);
      }
      return checkNewContainers(code);
    }
    function documentContinue(code) {
      continued++;
      if (self.containerState._closeFlow) {
        self.containerState._closeFlow = void 0;
        if (childFlow) {
          closeFlow();
        }
        const indexBeforeExits = self.events.length;
        let indexBeforeFlow = indexBeforeExits;
        let point3;
        while (indexBeforeFlow--) {
          if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === "chunkFlow") {
            point3 = self.events[indexBeforeFlow][1].end;
            break;
          }
        }
        exitContainers(continued);
        let index2 = indexBeforeExits;
        while (index2 < self.events.length) {
          self.events[index2][1].end = {
            ...point3
          };
          index2++;
        }
        splice(self.events, indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
        self.events.length = index2;
        return checkNewContainers(code);
      }
      return start(code);
    }
    function checkNewContainers(code) {
      if (continued === stack.length) {
        if (!childFlow) {
          return documentContinued(code);
        }
        if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
          return flowStart(code);
        }
        self.interrupt = Boolean(childFlow.currentConstruct && !childFlow._gfmTableDynamicInterruptHack);
      }
      self.containerState = {};
      return effects.check(containerConstruct, thereIsANewContainer, thereIsNoNewContainer)(code);
    }
    function thereIsANewContainer(code) {
      if (childFlow)
        closeFlow();
      exitContainers(continued);
      return documentContinued(code);
    }
    function thereIsNoNewContainer(code) {
      self.parser.lazy[self.now().line] = continued !== stack.length;
      lineStartOffset = self.now().offset;
      return flowStart(code);
    }
    function documentContinued(code) {
      self.containerState = {};
      return effects.attempt(containerConstruct, containerContinue, flowStart)(code);
    }
    function containerContinue(code) {
      continued++;
      stack.push([self.currentConstruct, self.containerState]);
      return documentContinued(code);
    }
    function flowStart(code) {
      if (code === null) {
        if (childFlow)
          closeFlow();
        exitContainers(0);
        effects.consume(code);
        return;
      }
      childFlow = childFlow || self.parser.flow(self.now());
      effects.enter("chunkFlow", {
        _tokenizer: childFlow,
        contentType: "flow",
        previous: childToken
      });
      return flowContinue(code);
    }
    function flowContinue(code) {
      if (code === null) {
        writeToChild(effects.exit("chunkFlow"), true);
        exitContainers(0);
        effects.consume(code);
        return;
      }
      if (markdownLineEnding(code)) {
        effects.consume(code);
        writeToChild(effects.exit("chunkFlow"));
        continued = 0;
        self.interrupt = void 0;
        return start;
      }
      effects.consume(code);
      return flowContinue;
    }
    function writeToChild(token, endOfFile) {
      const stream = self.sliceStream(token);
      if (endOfFile)
        stream.push(null);
      token.previous = childToken;
      if (childToken)
        childToken.next = token;
      childToken = token;
      childFlow.defineSkip(token.start);
      childFlow.write(stream);
      if (self.parser.lazy[token.start.line]) {
        let index2 = childFlow.events.length;
        while (index2--) {
          if (
            // The token starts before the line ending…
            childFlow.events[index2][1].start.offset < lineStartOffset && // …and either is not ended yet…
            (!childFlow.events[index2][1].end || // …or ends after it.
            childFlow.events[index2][1].end.offset > lineStartOffset)
          ) {
            return;
          }
        }
        const indexBeforeExits = self.events.length;
        let indexBeforeFlow = indexBeforeExits;
        let seen;
        let point3;
        while (indexBeforeFlow--) {
          if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === "chunkFlow") {
            if (seen) {
              point3 = self.events[indexBeforeFlow][1].end;
              break;
            }
            seen = true;
          }
        }
        exitContainers(continued);
        index2 = indexBeforeExits;
        while (index2 < self.events.length) {
          self.events[index2][1].end = {
            ...point3
          };
          index2++;
        }
        splice(self.events, indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
        self.events.length = index2;
      }
    }
    function exitContainers(size) {
      let index2 = stack.length;
      while (index2-- > size) {
        const entry = stack[index2];
        self.containerState = entry[1];
        entry[0].exit.call(self, effects);
      }
      stack.length = size;
    }
    function closeFlow() {
      childFlow.write([null]);
      childToken = void 0;
      childFlow = void 0;
      self.containerState._closeFlow = void 0;
    }
  }
  function tokenizeContainer(effects, ok, nok) {
    return factorySpace(effects, effects.attempt(this.parser.constructs.document, ok, nok), "linePrefix", this.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
  }

  // node_modules/micromark-util-classify-character/index.js
  function classifyCharacter(code) {
    if (code === null || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) {
      return 1;
    }
    if (unicodePunctuation(code)) {
      return 2;
    }
  }

  // node_modules/micromark-util-resolve-all/index.js
  function resolveAll(constructs2, events, context) {
    const called = [];
    let index2 = -1;
    while (++index2 < constructs2.length) {
      const resolve = constructs2[index2].resolveAll;
      if (resolve && !called.includes(resolve)) {
        events = resolve(events, context);
        called.push(resolve);
      }
    }
    return events;
  }

  // node_modules/micromark-core-commonmark/lib/attention.js
  var attention = {
    name: "attention",
    resolveAll: resolveAllAttention,
    tokenize: tokenizeAttention
  };
  function resolveAllAttention(events, context) {
    let index2 = -1;
    let open;
    let group;
    let text3;
    let openingSequence;
    let closingSequence;
    let use;
    let nextEvents;
    let offset;
    while (++index2 < events.length) {
      if (events[index2][0] === "enter" && events[index2][1].type === "attentionSequence" && events[index2][1]._close) {
        open = index2;
        while (open--) {
          if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && // If the markers are the same:
          context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index2][1]).charCodeAt(0)) {
            if ((events[open][1]._close || events[index2][1]._open) && (events[index2][1].end.offset - events[index2][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index2][1].end.offset - events[index2][1].start.offset) % 3)) {
              continue;
            }
            use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index2][1].end.offset - events[index2][1].start.offset > 1 ? 2 : 1;
            const start = {
              ...events[open][1].end
            };
            const end = {
              ...events[index2][1].start
            };
            movePoint(start, -use);
            movePoint(end, use);
            openingSequence = {
              type: use > 1 ? "strongSequence" : "emphasisSequence",
              start,
              end: {
                ...events[open][1].end
              }
            };
            closingSequence = {
              type: use > 1 ? "strongSequence" : "emphasisSequence",
              start: {
                ...events[index2][1].start
              },
              end
            };
            text3 = {
              type: use > 1 ? "strongText" : "emphasisText",
              start: {
                ...events[open][1].end
              },
              end: {
                ...events[index2][1].start
              }
            };
            group = {
              type: use > 1 ? "strong" : "emphasis",
              start: {
                ...openingSequence.start
              },
              end: {
                ...closingSequence.end
              }
            };
            events[open][1].end = {
              ...openingSequence.start
            };
            events[index2][1].start = {
              ...closingSequence.end
            };
            nextEvents = [];
            if (events[open][1].end.offset - events[open][1].start.offset) {
              nextEvents = push(nextEvents, [["enter", events[open][1], context], ["exit", events[open][1], context]]);
            }
            nextEvents = push(nextEvents, [["enter", group, context], ["enter", openingSequence, context], ["exit", openingSequence, context], ["enter", text3, context]]);
            nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index2), context));
            nextEvents = push(nextEvents, [["exit", text3, context], ["enter", closingSequence, context], ["exit", closingSequence, context], ["exit", group, context]]);
            if (events[index2][1].end.offset - events[index2][1].start.offset) {
              offset = 2;
              nextEvents = push(nextEvents, [["enter", events[index2][1], context], ["exit", events[index2][1], context]]);
            } else {
              offset = 0;
            }
            splice(events, open - 1, index2 - open + 3, nextEvents);
            index2 = open + nextEvents.length - offset - 2;
            break;
          }
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === "attentionSequence") {
        events[index2][1].type = "data";
      }
    }
    return events;
  }
  function tokenizeAttention(effects, ok) {
    const attentionMarkers2 = this.parser.constructs.attentionMarkers.null;
    const previous2 = this.previous;
    const before = classifyCharacter(previous2);
    let marker;
    return start;
    function start(code) {
      marker = code;
      effects.enter("attentionSequence");
      return inside(code);
    }
    function inside(code) {
      if (code === marker) {
        effects.consume(code);
        return inside;
      }
      const token = effects.exit("attentionSequence");
      const after = classifyCharacter(code);
      const open = !after || after === 2 && before || attentionMarkers2.includes(code);
      const close = !before || before === 2 && after || attentionMarkers2.includes(previous2);
      token._open = Boolean(marker === 42 ? open : open && (before || !close));
      token._close = Boolean(marker === 42 ? close : close && (after || !open));
      return ok(code);
    }
  }
  function movePoint(point3, offset) {
    point3.column += offset;
    point3.offset += offset;
    point3._bufferIndex += offset;
  }

  // node_modules/micromark-core-commonmark/lib/autolink.js
  var autolink = {
    name: "autolink",
    tokenize: tokenizeAutolink
  };
  function tokenizeAutolink(effects, ok, nok) {
    let size = 0;
    return start;
    function start(code) {
      effects.enter("autolink");
      effects.enter("autolinkMarker");
      effects.consume(code);
      effects.exit("autolinkMarker");
      effects.enter("autolinkProtocol");
      return open;
    }
    function open(code) {
      if (asciiAlpha(code)) {
        effects.consume(code);
        return schemeOrEmailAtext;
      }
      if (code === 64) {
        return nok(code);
      }
      return emailAtext(code);
    }
    function schemeOrEmailAtext(code) {
      if (code === 43 || code === 45 || code === 46 || asciiAlphanumeric(code)) {
        size = 1;
        return schemeInsideOrEmailAtext(code);
      }
      return emailAtext(code);
    }
    function schemeInsideOrEmailAtext(code) {
      if (code === 58) {
        effects.consume(code);
        size = 0;
        return urlInside;
      }
      if ((code === 43 || code === 45 || code === 46 || asciiAlphanumeric(code)) && size++ < 32) {
        effects.consume(code);
        return schemeInsideOrEmailAtext;
      }
      size = 0;
      return emailAtext(code);
    }
    function urlInside(code) {
      if (code === 62) {
        effects.exit("autolinkProtocol");
        effects.enter("autolinkMarker");
        effects.consume(code);
        effects.exit("autolinkMarker");
        effects.exit("autolink");
        return ok;
      }
      if (code === null || code === 32 || code === 60 || asciiControl(code)) {
        return nok(code);
      }
      effects.consume(code);
      return urlInside;
    }
    function emailAtext(code) {
      if (code === 64) {
        effects.consume(code);
        return emailAtSignOrDot;
      }
      if (asciiAtext(code)) {
        effects.consume(code);
        return emailAtext;
      }
      return nok(code);
    }
    function emailAtSignOrDot(code) {
      return asciiAlphanumeric(code) ? emailLabel(code) : nok(code);
    }
    function emailLabel(code) {
      if (code === 46) {
        effects.consume(code);
        size = 0;
        return emailAtSignOrDot;
      }
      if (code === 62) {
        effects.exit("autolinkProtocol").type = "autolinkEmail";
        effects.enter("autolinkMarker");
        effects.consume(code);
        effects.exit("autolinkMarker");
        effects.exit("autolink");
        return ok;
      }
      return emailValue(code);
    }
    function emailValue(code) {
      if ((code === 45 || asciiAlphanumeric(code)) && size++ < 63) {
        const next = code === 45 ? emailValue : emailLabel;
        effects.consume(code);
        return next;
      }
      return nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/blank-line.js
  var blankLine = {
    partial: true,
    tokenize: tokenizeBlankLine
  };
  function tokenizeBlankLine(effects, ok, nok) {
    return start;
    function start(code) {
      return markdownSpace(code) ? factorySpace(effects, after, "linePrefix")(code) : after(code);
    }
    function after(code) {
      return code === null || markdownLineEnding(code) ? ok(code) : nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/block-quote.js
  var blockQuote = {
    continuation: {
      tokenize: tokenizeBlockQuoteContinuation
    },
    exit,
    name: "blockQuote",
    tokenize: tokenizeBlockQuoteStart
  };
  function tokenizeBlockQuoteStart(effects, ok, nok) {
    const self = this;
    return start;
    function start(code) {
      if (code === 62) {
        const state = self.containerState;
        if (!state.open) {
          effects.enter("blockQuote", {
            _container: true
          });
          state.open = true;
        }
        effects.enter("blockQuotePrefix");
        effects.enter("blockQuoteMarker");
        effects.consume(code);
        effects.exit("blockQuoteMarker");
        return after;
      }
      return nok(code);
    }
    function after(code) {
      if (markdownSpace(code)) {
        effects.enter("blockQuotePrefixWhitespace");
        effects.consume(code);
        effects.exit("blockQuotePrefixWhitespace");
        effects.exit("blockQuotePrefix");
        return ok;
      }
      effects.exit("blockQuotePrefix");
      return ok(code);
    }
  }
  function tokenizeBlockQuoteContinuation(effects, ok, nok) {
    const self = this;
    return contStart;
    function contStart(code) {
      if (markdownSpace(code)) {
        return factorySpace(effects, contBefore, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code);
      }
      return contBefore(code);
    }
    function contBefore(code) {
      return effects.attempt(blockQuote, ok, nok)(code);
    }
  }
  function exit(effects) {
    effects.exit("blockQuote");
  }

  // node_modules/micromark-core-commonmark/lib/character-escape.js
  var characterEscape = {
    name: "characterEscape",
    tokenize: tokenizeCharacterEscape
  };
  function tokenizeCharacterEscape(effects, ok, nok) {
    return start;
    function start(code) {
      effects.enter("characterEscape");
      effects.enter("escapeMarker");
      effects.consume(code);
      effects.exit("escapeMarker");
      return inside;
    }
    function inside(code) {
      if (asciiPunctuation(code)) {
        effects.enter("characterEscapeValue");
        effects.consume(code);
        effects.exit("characterEscapeValue");
        effects.exit("characterEscape");
        return ok;
      }
      return nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/character-reference.js
  var characterReference = {
    name: "characterReference",
    tokenize: tokenizeCharacterReference
  };
  function tokenizeCharacterReference(effects, ok, nok) {
    const self = this;
    let size = 0;
    let max;
    let test;
    return start;
    function start(code) {
      effects.enter("characterReference");
      effects.enter("characterReferenceMarker");
      effects.consume(code);
      effects.exit("characterReferenceMarker");
      return open;
    }
    function open(code) {
      if (code === 35) {
        effects.enter("characterReferenceMarkerNumeric");
        effects.consume(code);
        effects.exit("characterReferenceMarkerNumeric");
        return numeric;
      }
      effects.enter("characterReferenceValue");
      max = 31;
      test = asciiAlphanumeric;
      return value(code);
    }
    function numeric(code) {
      if (code === 88 || code === 120) {
        effects.enter("characterReferenceMarkerHexadecimal");
        effects.consume(code);
        effects.exit("characterReferenceMarkerHexadecimal");
        effects.enter("characterReferenceValue");
        max = 6;
        test = asciiHexDigit;
        return value;
      }
      effects.enter("characterReferenceValue");
      max = 7;
      test = asciiDigit;
      return value(code);
    }
    function value(code) {
      if (code === 59 && size) {
        const token = effects.exit("characterReferenceValue");
        if (test === asciiAlphanumeric && !decodeNamedCharacterReference(self.sliceSerialize(token))) {
          return nok(code);
        }
        effects.enter("characterReferenceMarker");
        effects.consume(code);
        effects.exit("characterReferenceMarker");
        effects.exit("characterReference");
        return ok;
      }
      if (test(code) && size++ < max) {
        effects.consume(code);
        return value;
      }
      return nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/code-fenced.js
  var nonLazyContinuation = {
    partial: true,
    tokenize: tokenizeNonLazyContinuation
  };
  var codeFenced = {
    concrete: true,
    name: "codeFenced",
    tokenize: tokenizeCodeFenced
  };
  function tokenizeCodeFenced(effects, ok, nok) {
    const self = this;
    const closeStart = {
      partial: true,
      tokenize: tokenizeCloseStart
    };
    let initialPrefix = 0;
    let sizeOpen = 0;
    let marker;
    return start;
    function start(code) {
      return beforeSequenceOpen(code);
    }
    function beforeSequenceOpen(code) {
      const tail = self.events[self.events.length - 1];
      initialPrefix = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
      marker = code;
      effects.enter("codeFenced");
      effects.enter("codeFencedFence");
      effects.enter("codeFencedFenceSequence");
      return sequenceOpen(code);
    }
    function sequenceOpen(code) {
      if (code === marker) {
        sizeOpen++;
        effects.consume(code);
        return sequenceOpen;
      }
      if (sizeOpen < 3) {
        return nok(code);
      }
      effects.exit("codeFencedFenceSequence");
      return markdownSpace(code) ? factorySpace(effects, infoBefore, "whitespace")(code) : infoBefore(code);
    }
    function infoBefore(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("codeFencedFence");
        return self.interrupt ? ok(code) : effects.check(nonLazyContinuation, atNonLazyBreak, after)(code);
      }
      effects.enter("codeFencedFenceInfo");
      effects.enter("chunkString", {
        contentType: "string"
      });
      return info(code);
    }
    function info(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("chunkString");
        effects.exit("codeFencedFenceInfo");
        return infoBefore(code);
      }
      if (markdownSpace(code)) {
        effects.exit("chunkString");
        effects.exit("codeFencedFenceInfo");
        return factorySpace(effects, metaBefore, "whitespace")(code);
      }
      if (code === 96 && code === marker) {
        return nok(code);
      }
      effects.consume(code);
      return info;
    }
    function metaBefore(code) {
      if (code === null || markdownLineEnding(code)) {
        return infoBefore(code);
      }
      effects.enter("codeFencedFenceMeta");
      effects.enter("chunkString", {
        contentType: "string"
      });
      return meta(code);
    }
    function meta(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("chunkString");
        effects.exit("codeFencedFenceMeta");
        return infoBefore(code);
      }
      if (code === 96 && code === marker) {
        return nok(code);
      }
      effects.consume(code);
      return meta;
    }
    function atNonLazyBreak(code) {
      return effects.attempt(closeStart, after, contentBefore)(code);
    }
    function contentBefore(code) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return contentStart;
    }
    function contentStart(code) {
      return initialPrefix > 0 && markdownSpace(code) ? factorySpace(effects, beforeContentChunk, "linePrefix", initialPrefix + 1)(code) : beforeContentChunk(code);
    }
    function beforeContentChunk(code) {
      if (code === null || markdownLineEnding(code)) {
        return effects.check(nonLazyContinuation, atNonLazyBreak, after)(code);
      }
      effects.enter("codeFlowValue");
      return contentChunk(code);
    }
    function contentChunk(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("codeFlowValue");
        return beforeContentChunk(code);
      }
      effects.consume(code);
      return contentChunk;
    }
    function after(code) {
      effects.exit("codeFenced");
      return ok(code);
    }
    function tokenizeCloseStart(effects2, ok2, nok2) {
      let size = 0;
      return startBefore;
      function startBefore(code) {
        effects2.enter("lineEnding");
        effects2.consume(code);
        effects2.exit("lineEnding");
        return start2;
      }
      function start2(code) {
        effects2.enter("codeFencedFence");
        return markdownSpace(code) ? factorySpace(effects2, beforeSequenceClose, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code) : beforeSequenceClose(code);
      }
      function beforeSequenceClose(code) {
        if (code === marker) {
          effects2.enter("codeFencedFenceSequence");
          return sequenceClose(code);
        }
        return nok2(code);
      }
      function sequenceClose(code) {
        if (code === marker) {
          size++;
          effects2.consume(code);
          return sequenceClose;
        }
        if (size >= sizeOpen) {
          effects2.exit("codeFencedFenceSequence");
          return markdownSpace(code) ? factorySpace(effects2, sequenceCloseAfter, "whitespace")(code) : sequenceCloseAfter(code);
        }
        return nok2(code);
      }
      function sequenceCloseAfter(code) {
        if (code === null || markdownLineEnding(code)) {
          effects2.exit("codeFencedFence");
          return ok2(code);
        }
        return nok2(code);
      }
    }
  }
  function tokenizeNonLazyContinuation(effects, ok, nok) {
    const self = this;
    return start;
    function start(code) {
      if (code === null) {
        return nok(code);
      }
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return lineStart;
    }
    function lineStart(code) {
      return self.parser.lazy[self.now().line] ? nok(code) : ok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/code-indented.js
  var codeIndented = {
    name: "codeIndented",
    tokenize: tokenizeCodeIndented
  };
  var furtherStart = {
    partial: true,
    tokenize: tokenizeFurtherStart
  };
  function tokenizeCodeIndented(effects, ok, nok) {
    const self = this;
    return start;
    function start(code) {
      effects.enter("codeIndented");
      return factorySpace(effects, afterPrefix, "linePrefix", 4 + 1)(code);
    }
    function afterPrefix(code) {
      const tail = self.events[self.events.length - 1];
      return tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4 ? atBreak(code) : nok(code);
    }
    function atBreak(code) {
      if (code === null) {
        return after(code);
      }
      if (markdownLineEnding(code)) {
        return effects.attempt(furtherStart, atBreak, after)(code);
      }
      effects.enter("codeFlowValue");
      return inside(code);
    }
    function inside(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("codeFlowValue");
        return atBreak(code);
      }
      effects.consume(code);
      return inside;
    }
    function after(code) {
      effects.exit("codeIndented");
      return ok(code);
    }
  }
  function tokenizeFurtherStart(effects, ok, nok) {
    const self = this;
    return furtherStart2;
    function furtherStart2(code) {
      if (self.parser.lazy[self.now().line]) {
        return nok(code);
      }
      if (markdownLineEnding(code)) {
        effects.enter("lineEnding");
        effects.consume(code);
        effects.exit("lineEnding");
        return furtherStart2;
      }
      return factorySpace(effects, afterPrefix, "linePrefix", 4 + 1)(code);
    }
    function afterPrefix(code) {
      const tail = self.events[self.events.length - 1];
      return tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4 ? ok(code) : markdownLineEnding(code) ? furtherStart2(code) : nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/code-text.js
  var codeText = {
    name: "codeText",
    previous,
    resolve: resolveCodeText,
    tokenize: tokenizeCodeText
  };
  function resolveCodeText(events) {
    let tailExitIndex = events.length - 4;
    let headEnterIndex = 3;
    let index2;
    let enter;
    if ((events[headEnterIndex][1].type === "lineEnding" || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === "lineEnding" || events[tailExitIndex][1].type === "space")) {
      index2 = headEnterIndex;
      while (++index2 < tailExitIndex) {
        if (events[index2][1].type === "codeTextData") {
          events[headEnterIndex][1].type = "codeTextPadding";
          events[tailExitIndex][1].type = "codeTextPadding";
          headEnterIndex += 2;
          tailExitIndex -= 2;
          break;
        }
      }
    }
    index2 = headEnterIndex - 1;
    tailExitIndex++;
    while (++index2 <= tailExitIndex) {
      if (enter === void 0) {
        if (index2 !== tailExitIndex && events[index2][1].type !== "lineEnding") {
          enter = index2;
        }
      } else if (index2 === tailExitIndex || events[index2][1].type === "lineEnding") {
        events[enter][1].type = "codeTextData";
        if (index2 !== enter + 2) {
          events[enter][1].end = events[index2 - 1][1].end;
          events.splice(enter + 2, index2 - enter - 2);
          tailExitIndex -= index2 - enter - 2;
          index2 = enter + 2;
        }
        enter = void 0;
      }
    }
    return events;
  }
  function previous(code) {
    return code !== 96 || this.events[this.events.length - 1][1].type === "characterEscape";
  }
  function tokenizeCodeText(effects, ok, nok) {
    const self = this;
    let sizeOpen = 0;
    let size;
    let token;
    return start;
    function start(code) {
      effects.enter("codeText");
      effects.enter("codeTextSequence");
      return sequenceOpen(code);
    }
    function sequenceOpen(code) {
      if (code === 96) {
        effects.consume(code);
        sizeOpen++;
        return sequenceOpen;
      }
      effects.exit("codeTextSequence");
      return between(code);
    }
    function between(code) {
      if (code === null) {
        return nok(code);
      }
      if (code === 32) {
        effects.enter("space");
        effects.consume(code);
        effects.exit("space");
        return between;
      }
      if (code === 96) {
        token = effects.enter("codeTextSequence");
        size = 0;
        return sequenceClose(code);
      }
      if (markdownLineEnding(code)) {
        effects.enter("lineEnding");
        effects.consume(code);
        effects.exit("lineEnding");
        return between;
      }
      effects.enter("codeTextData");
      return data(code);
    }
    function data(code) {
      if (code === null || code === 32 || code === 96 || markdownLineEnding(code)) {
        effects.exit("codeTextData");
        return between(code);
      }
      effects.consume(code);
      return data;
    }
    function sequenceClose(code) {
      if (code === 96) {
        effects.consume(code);
        size++;
        return sequenceClose;
      }
      if (size === sizeOpen) {
        effects.exit("codeTextSequence");
        effects.exit("codeText");
        return ok(code);
      }
      token.type = "codeTextData";
      return data(code);
    }
  }

  // node_modules/micromark-util-subtokenize/lib/splice-buffer.js
  var SpliceBuffer = class {
    /**
     * @param {ReadonlyArray<T> | null | undefined} [initial]
     *   Initial items (optional).
     * @returns
     *   Splice buffer.
     */
    constructor(initial) {
      this.left = initial ? [...initial] : [];
      this.right = [];
    }
    /**
     * Array access;
     * does not move the cursor.
     *
     * @param {number} index
     *   Index.
     * @return {T}
     *   Item.
     */
    get(index2) {
      if (index2 < 0 || index2 >= this.left.length + this.right.length) {
        throw new RangeError("Cannot access index `" + index2 + "` in a splice buffer of size `" + (this.left.length + this.right.length) + "`");
      }
      if (index2 < this.left.length)
        return this.left[index2];
      return this.right[this.right.length - index2 + this.left.length - 1];
    }
    /**
     * The length of the splice buffer, one greater than the largest index in the
     * array.
     */
    get length() {
      return this.left.length + this.right.length;
    }
    /**
     * Remove and return `list[0]`;
     * moves the cursor to `0`.
     *
     * @returns {T | undefined}
     *   Item, optional.
     */
    shift() {
      this.setCursor(0);
      return this.right.pop();
    }
    /**
     * Slice the buffer to get an array;
     * does not move the cursor.
     *
     * @param {number} start
     *   Start.
     * @param {number | null | undefined} [end]
     *   End (optional).
     * @returns {Array<T>}
     *   Array of items.
     */
    slice(start, end) {
      const stop = end === null || end === void 0 ? Number.POSITIVE_INFINITY : end;
      if (stop < this.left.length) {
        return this.left.slice(start, stop);
      }
      if (start > this.left.length) {
        return this.right.slice(this.right.length - stop + this.left.length, this.right.length - start + this.left.length).reverse();
      }
      return this.left.slice(start).concat(this.right.slice(this.right.length - stop + this.left.length).reverse());
    }
    /**
     * Mimics the behavior of Array.prototype.splice() except for the change of
     * interface necessary to avoid segfaults when patching in very large arrays.
     *
     * This operation moves cursor is moved to `start` and results in the cursor
     * placed after any inserted items.
     *
     * @param {number} start
     *   Start;
     *   zero-based index at which to start changing the array;
     *   negative numbers count backwards from the end of the array and values
     *   that are out-of bounds are clamped to the appropriate end of the array.
     * @param {number | null | undefined} [deleteCount=0]
     *   Delete count (default: `0`);
     *   maximum number of elements to delete, starting from start.
     * @param {Array<T> | null | undefined} [items=[]]
     *   Items to include in place of the deleted items (default: `[]`).
     * @return {Array<T>}
     *   Any removed items.
     */
    splice(start, deleteCount, items) {
      const count = deleteCount || 0;
      this.setCursor(Math.trunc(start));
      const removed = this.right.splice(this.right.length - count, Number.POSITIVE_INFINITY);
      if (items)
        chunkedPush(this.left, items);
      return removed.reverse();
    }
    /**
     * Remove and return the highest-numbered item in the array, so
     * `list[list.length - 1]`;
     * Moves the cursor to `length`.
     *
     * @returns {T | undefined}
     *   Item, optional.
     */
    pop() {
      this.setCursor(Number.POSITIVE_INFINITY);
      return this.left.pop();
    }
    /**
     * Inserts a single item to the high-numbered side of the array;
     * moves the cursor to `length`.
     *
     * @param {T} item
     *   Item.
     * @returns {undefined}
     *   Nothing.
     */
    push(item) {
      this.setCursor(Number.POSITIVE_INFINITY);
      this.left.push(item);
    }
    /**
     * Inserts many items to the high-numbered side of the array.
     * Moves the cursor to `length`.
     *
     * @param {Array<T>} items
     *   Items.
     * @returns {undefined}
     *   Nothing.
     */
    pushMany(items) {
      this.setCursor(Number.POSITIVE_INFINITY);
      chunkedPush(this.left, items);
    }
    /**
     * Inserts a single item to the low-numbered side of the array;
     * Moves the cursor to `0`.
     *
     * @param {T} item
     *   Item.
     * @returns {undefined}
     *   Nothing.
     */
    unshift(item) {
      this.setCursor(0);
      this.right.push(item);
    }
    /**
     * Inserts many items to the low-numbered side of the array;
     * moves the cursor to `0`.
     *
     * @param {Array<T>} items
     *   Items.
     * @returns {undefined}
     *   Nothing.
     */
    unshiftMany(items) {
      this.setCursor(0);
      chunkedPush(this.right, items.reverse());
    }
    /**
     * Move the cursor to a specific position in the array. Requires
     * time proportional to the distance moved.
     *
     * If `n < 0`, the cursor will end up at the beginning.
     * If `n > length`, the cursor will end up at the end.
     *
     * @param {number} n
     *   Position.
     * @return {undefined}
     *   Nothing.
     */
    setCursor(n) {
      if (n === this.left.length || n > this.left.length && this.right.length === 0 || n < 0 && this.left.length === 0)
        return;
      if (n < this.left.length) {
        const removed = this.left.splice(n, Number.POSITIVE_INFINITY);
        chunkedPush(this.right, removed.reverse());
      } else {
        const removed = this.right.splice(this.left.length + this.right.length - n, Number.POSITIVE_INFINITY);
        chunkedPush(this.left, removed.reverse());
      }
    }
  };
  function chunkedPush(list2, right) {
    let chunkStart = 0;
    if (right.length < 1e4) {
      list2.push(...right);
    } else {
      while (chunkStart < right.length) {
        list2.push(...right.slice(chunkStart, chunkStart + 1e4));
        chunkStart += 1e4;
      }
    }
  }

  // node_modules/micromark-util-subtokenize/index.js
  function subtokenize(eventsArray) {
    const jumps = {};
    let index2 = -1;
    let event;
    let lineIndex;
    let otherIndex;
    let otherEvent;
    let parameters;
    let subevents;
    let more;
    const events = new SpliceBuffer(eventsArray);
    while (++index2 < events.length) {
      while (index2 in jumps) {
        index2 = jumps[index2];
      }
      event = events.get(index2);
      if (index2 && event[1].type === "chunkFlow" && events.get(index2 - 1)[1].type === "listItemPrefix") {
        subevents = event[1]._tokenizer.events;
        otherIndex = 0;
        if (otherIndex < subevents.length && subevents[otherIndex][1].type === "lineEndingBlank") {
          otherIndex += 2;
        }
        if (otherIndex < subevents.length && subevents[otherIndex][1].type === "content") {
          while (++otherIndex < subevents.length) {
            if (subevents[otherIndex][1].type === "content") {
              break;
            }
            if (subevents[otherIndex][1].type === "chunkText") {
              subevents[otherIndex][1]._isInFirstContentOfListItem = true;
              otherIndex++;
            }
          }
        }
      }
      if (event[0] === "enter") {
        if (event[1].contentType) {
          Object.assign(jumps, subcontent(events, index2));
          index2 = jumps[index2];
          more = true;
        }
      } else if (event[1]._container) {
        otherIndex = index2;
        lineIndex = void 0;
        while (otherIndex--) {
          otherEvent = events.get(otherIndex);
          if (otherEvent[1].type === "lineEnding" || otherEvent[1].type === "lineEndingBlank") {
            if (otherEvent[0] === "enter") {
              if (lineIndex) {
                events.get(lineIndex)[1].type = "lineEndingBlank";
              }
              otherEvent[1].type = "lineEnding";
              lineIndex = otherIndex;
            }
          } else if (otherEvent[1].type === "linePrefix" || otherEvent[1].type === "listItemIndent") {
          } else {
            break;
          }
        }
        if (lineIndex) {
          event[1].end = {
            ...events.get(lineIndex)[1].start
          };
          parameters = events.slice(lineIndex, index2);
          parameters.unshift(event);
          events.splice(lineIndex, index2 - lineIndex + 1, parameters);
        }
      }
    }
    splice(eventsArray, 0, Number.POSITIVE_INFINITY, events.slice(0));
    return !more;
  }
  function subcontent(events, eventIndex) {
    const token = events.get(eventIndex)[1];
    const context = events.get(eventIndex)[2];
    let startPosition = eventIndex - 1;
    const startPositions = [];
    let tokenizer = token._tokenizer;
    if (!tokenizer) {
      tokenizer = context.parser[token.contentType](token.start);
      if (token._contentTypeTextTrailing) {
        tokenizer._contentTypeTextTrailing = true;
      }
    }
    const childEvents = tokenizer.events;
    const jumps = [];
    const gaps = {};
    let stream;
    let previous2;
    let index2 = -1;
    let current = token;
    let adjust = 0;
    let start = 0;
    const breaks = [start];
    while (current) {
      while (events.get(++startPosition)[1] !== current) {
      }
      startPositions.push(startPosition);
      if (!current._tokenizer) {
        stream = context.sliceStream(current);
        if (!current.next) {
          stream.push(null);
        }
        if (previous2) {
          tokenizer.defineSkip(current.start);
        }
        if (current._isInFirstContentOfListItem) {
          tokenizer._gfmTasklistFirstContentOfListItem = true;
        }
        tokenizer.write(stream);
        if (current._isInFirstContentOfListItem) {
          tokenizer._gfmTasklistFirstContentOfListItem = void 0;
        }
      }
      previous2 = current;
      current = current.next;
    }
    current = token;
    while (++index2 < childEvents.length) {
      if (
        // Find a void token that includes a break.
        childEvents[index2][0] === "exit" && childEvents[index2 - 1][0] === "enter" && childEvents[index2][1].type === childEvents[index2 - 1][1].type && childEvents[index2][1].start.line !== childEvents[index2][1].end.line
      ) {
        start = index2 + 1;
        breaks.push(start);
        current._tokenizer = void 0;
        current.previous = void 0;
        current = current.next;
      }
    }
    tokenizer.events = [];
    if (current) {
      current._tokenizer = void 0;
      current.previous = void 0;
    } else {
      breaks.pop();
    }
    index2 = breaks.length;
    while (index2--) {
      const slice = childEvents.slice(breaks[index2], breaks[index2 + 1]);
      const start2 = startPositions.pop();
      jumps.push([start2, start2 + slice.length - 1]);
      events.splice(start2, 2, slice);
    }
    jumps.reverse();
    index2 = -1;
    while (++index2 < jumps.length) {
      gaps[adjust + jumps[index2][0]] = adjust + jumps[index2][1];
      adjust += jumps[index2][1] - jumps[index2][0] - 1;
    }
    return gaps;
  }

  // node_modules/micromark-core-commonmark/lib/content.js
  var content2 = {
    resolve: resolveContent,
    tokenize: tokenizeContent
  };
  var continuationConstruct = {
    partial: true,
    tokenize: tokenizeContinuation
  };
  function resolveContent(events) {
    subtokenize(events);
    return events;
  }
  function tokenizeContent(effects, ok) {
    let previous2;
    return chunkStart;
    function chunkStart(code) {
      effects.enter("content");
      previous2 = effects.enter("chunkContent", {
        contentType: "content"
      });
      return chunkInside(code);
    }
    function chunkInside(code) {
      if (code === null) {
        return contentEnd(code);
      }
      if (markdownLineEnding(code)) {
        return effects.check(continuationConstruct, contentContinue, contentEnd)(code);
      }
      effects.consume(code);
      return chunkInside;
    }
    function contentEnd(code) {
      effects.exit("chunkContent");
      effects.exit("content");
      return ok(code);
    }
    function contentContinue(code) {
      effects.consume(code);
      effects.exit("chunkContent");
      previous2.next = effects.enter("chunkContent", {
        contentType: "content",
        previous: previous2
      });
      previous2 = previous2.next;
      return chunkInside;
    }
  }
  function tokenizeContinuation(effects, ok, nok) {
    const self = this;
    return startLookahead;
    function startLookahead(code) {
      effects.exit("chunkContent");
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return factorySpace(effects, prefixed, "linePrefix");
    }
    function prefixed(code) {
      if (code === null || markdownLineEnding(code)) {
        return nok(code);
      }
      const tail = self.events[self.events.length - 1];
      if (!self.parser.constructs.disable.null.includes("codeIndented") && tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4) {
        return ok(code);
      }
      return effects.interrupt(self.parser.constructs.flow, nok, ok)(code);
    }
  }

  // node_modules/micromark-factory-destination/index.js
  function factoryDestination(effects, ok, nok, type, literalType, literalMarkerType, rawType, stringType, max) {
    const limit = max || Number.POSITIVE_INFINITY;
    let balance = 0;
    return start;
    function start(code) {
      if (code === 60) {
        effects.enter(type);
        effects.enter(literalType);
        effects.enter(literalMarkerType);
        effects.consume(code);
        effects.exit(literalMarkerType);
        return enclosedBefore;
      }
      if (code === null || code === 32 || code === 41 || asciiControl(code)) {
        return nok(code);
      }
      effects.enter(type);
      effects.enter(rawType);
      effects.enter(stringType);
      effects.enter("chunkString", {
        contentType: "string"
      });
      return raw(code);
    }
    function enclosedBefore(code) {
      if (code === 62) {
        effects.enter(literalMarkerType);
        effects.consume(code);
        effects.exit(literalMarkerType);
        effects.exit(literalType);
        effects.exit(type);
        return ok;
      }
      effects.enter(stringType);
      effects.enter("chunkString", {
        contentType: "string"
      });
      return enclosed(code);
    }
    function enclosed(code) {
      if (code === 62) {
        effects.exit("chunkString");
        effects.exit(stringType);
        return enclosedBefore(code);
      }
      if (code === null || code === 60 || markdownLineEnding(code)) {
        return nok(code);
      }
      effects.consume(code);
      return code === 92 ? enclosedEscape : enclosed;
    }
    function enclosedEscape(code) {
      if (code === 60 || code === 62 || code === 92) {
        effects.consume(code);
        return enclosed;
      }
      return enclosed(code);
    }
    function raw(code) {
      if (!balance && (code === null || code === 41 || markdownLineEndingOrSpace(code))) {
        effects.exit("chunkString");
        effects.exit(stringType);
        effects.exit(rawType);
        effects.exit(type);
        return ok(code);
      }
      if (balance < limit && code === 40) {
        effects.consume(code);
        balance++;
        return raw;
      }
      if (code === 41) {
        effects.consume(code);
        balance--;
        return raw;
      }
      if (code === null || code === 32 || code === 40 || asciiControl(code)) {
        return nok(code);
      }
      effects.consume(code);
      return code === 92 ? rawEscape : raw;
    }
    function rawEscape(code) {
      if (code === 40 || code === 41 || code === 92) {
        effects.consume(code);
        return raw;
      }
      return raw(code);
    }
  }

  // node_modules/micromark-factory-label/index.js
  function factoryLabel(effects, ok, nok, type, markerType, stringType) {
    const self = this;
    let size = 0;
    let seen;
    return start;
    function start(code) {
      effects.enter(type);
      effects.enter(markerType);
      effects.consume(code);
      effects.exit(markerType);
      effects.enter(stringType);
      return atBreak;
    }
    function atBreak(code) {
      if (size > 999 || code === null || code === 91 || code === 93 && !seen || // To do: remove in the future once we’ve switched from
      // `micromark-extension-footnote` to `micromark-extension-gfm-footnote`,
      // which doesn’t need this.
      // Hidden footnotes hook.
      /* c8 ignore next 3 */
      code === 94 && !size && "_hiddenFootnoteSupport" in self.parser.constructs) {
        return nok(code);
      }
      if (code === 93) {
        effects.exit(stringType);
        effects.enter(markerType);
        effects.consume(code);
        effects.exit(markerType);
        effects.exit(type);
        return ok;
      }
      if (markdownLineEnding(code)) {
        effects.enter("lineEnding");
        effects.consume(code);
        effects.exit("lineEnding");
        return atBreak;
      }
      effects.enter("chunkString", {
        contentType: "string"
      });
      return labelInside(code);
    }
    function labelInside(code) {
      if (code === null || code === 91 || code === 93 || markdownLineEnding(code) || size++ > 999) {
        effects.exit("chunkString");
        return atBreak(code);
      }
      effects.consume(code);
      if (!seen)
        seen = !markdownSpace(code);
      return code === 92 ? labelEscape : labelInside;
    }
    function labelEscape(code) {
      if (code === 91 || code === 92 || code === 93) {
        effects.consume(code);
        size++;
        return labelInside;
      }
      return labelInside(code);
    }
  }

  // node_modules/micromark-factory-title/index.js
  function factoryTitle(effects, ok, nok, type, markerType, stringType) {
    let marker;
    return start;
    function start(code) {
      if (code === 34 || code === 39 || code === 40) {
        effects.enter(type);
        effects.enter(markerType);
        effects.consume(code);
        effects.exit(markerType);
        marker = code === 40 ? 41 : code;
        return begin;
      }
      return nok(code);
    }
    function begin(code) {
      if (code === marker) {
        effects.enter(markerType);
        effects.consume(code);
        effects.exit(markerType);
        effects.exit(type);
        return ok;
      }
      effects.enter(stringType);
      return atBreak(code);
    }
    function atBreak(code) {
      if (code === marker) {
        effects.exit(stringType);
        return begin(marker);
      }
      if (code === null) {
        return nok(code);
      }
      if (markdownLineEnding(code)) {
        effects.enter("lineEnding");
        effects.consume(code);
        effects.exit("lineEnding");
        return factorySpace(effects, atBreak, "linePrefix");
      }
      effects.enter("chunkString", {
        contentType: "string"
      });
      return inside(code);
    }
    function inside(code) {
      if (code === marker || code === null || markdownLineEnding(code)) {
        effects.exit("chunkString");
        return atBreak(code);
      }
      effects.consume(code);
      return code === 92 ? escape : inside;
    }
    function escape(code) {
      if (code === marker || code === 92) {
        effects.consume(code);
        return inside;
      }
      return inside(code);
    }
  }

  // node_modules/micromark-factory-whitespace/index.js
  function factoryWhitespace(effects, ok) {
    let seen;
    return start;
    function start(code) {
      if (markdownLineEnding(code)) {
        effects.enter("lineEnding");
        effects.consume(code);
        effects.exit("lineEnding");
        seen = true;
        return start;
      }
      if (markdownSpace(code)) {
        return factorySpace(effects, start, seen ? "linePrefix" : "lineSuffix")(code);
      }
      return ok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/definition.js
  var definition = {
    name: "definition",
    tokenize: tokenizeDefinition
  };
  var titleBefore = {
    partial: true,
    tokenize: tokenizeTitleBefore
  };
  function tokenizeDefinition(effects, ok, nok) {
    const self = this;
    let identifier;
    return start;
    function start(code) {
      effects.enter("definition");
      return before(code);
    }
    function before(code) {
      return factoryLabel.call(
        self,
        effects,
        labelAfter,
        // Note: we don’t need to reset the way `markdown-rs` does.
        nok,
        "definitionLabel",
        "definitionLabelMarker",
        "definitionLabelString"
      )(code);
    }
    function labelAfter(code) {
      identifier = normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1));
      if (code === 58) {
        effects.enter("definitionMarker");
        effects.consume(code);
        effects.exit("definitionMarker");
        return markerAfter;
      }
      return nok(code);
    }
    function markerAfter(code) {
      return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, destinationBefore)(code) : destinationBefore(code);
    }
    function destinationBefore(code) {
      return factoryDestination(
        effects,
        destinationAfter,
        // Note: we don’t need to reset the way `markdown-rs` does.
        nok,
        "definitionDestination",
        "definitionDestinationLiteral",
        "definitionDestinationLiteralMarker",
        "definitionDestinationRaw",
        "definitionDestinationString"
      )(code);
    }
    function destinationAfter(code) {
      return effects.attempt(titleBefore, after, after)(code);
    }
    function after(code) {
      return markdownSpace(code) ? factorySpace(effects, afterWhitespace, "whitespace")(code) : afterWhitespace(code);
    }
    function afterWhitespace(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("definition");
        self.parser.defined.push(identifier);
        return ok(code);
      }
      return nok(code);
    }
  }
  function tokenizeTitleBefore(effects, ok, nok) {
    return titleBefore2;
    function titleBefore2(code) {
      return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, beforeMarker)(code) : nok(code);
    }
    function beforeMarker(code) {
      return factoryTitle(effects, titleAfter, nok, "definitionTitle", "definitionTitleMarker", "definitionTitleString")(code);
    }
    function titleAfter(code) {
      return markdownSpace(code) ? factorySpace(effects, titleAfterOptionalWhitespace, "whitespace")(code) : titleAfterOptionalWhitespace(code);
    }
    function titleAfterOptionalWhitespace(code) {
      return code === null || markdownLineEnding(code) ? ok(code) : nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/hard-break-escape.js
  var hardBreakEscape = {
    name: "hardBreakEscape",
    tokenize: tokenizeHardBreakEscape
  };
  function tokenizeHardBreakEscape(effects, ok, nok) {
    return start;
    function start(code) {
      effects.enter("hardBreakEscape");
      effects.consume(code);
      return after;
    }
    function after(code) {
      if (markdownLineEnding(code)) {
        effects.exit("hardBreakEscape");
        return ok(code);
      }
      return nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/heading-atx.js
  var headingAtx = {
    name: "headingAtx",
    resolve: resolveHeadingAtx,
    tokenize: tokenizeHeadingAtx
  };
  function resolveHeadingAtx(events, context) {
    let contentEnd = events.length - 2;
    let contentStart = 3;
    let content3;
    let text3;
    if (events[contentStart][1].type === "whitespace") {
      contentStart += 2;
    }
    if (contentEnd - 2 > contentStart && events[contentEnd][1].type === "whitespace") {
      contentEnd -= 2;
    }
    if (events[contentEnd][1].type === "atxHeadingSequence" && (contentStart === contentEnd - 1 || contentEnd - 4 > contentStart && events[contentEnd - 2][1].type === "whitespace")) {
      contentEnd -= contentStart + 1 === contentEnd ? 2 : 4;
    }
    if (contentEnd > contentStart) {
      content3 = {
        type: "atxHeadingText",
        start: events[contentStart][1].start,
        end: events[contentEnd][1].end
      };
      text3 = {
        type: "chunkText",
        start: events[contentStart][1].start,
        end: events[contentEnd][1].end,
        contentType: "text"
      };
      splice(events, contentStart, contentEnd - contentStart + 1, [["enter", content3, context], ["enter", text3, context], ["exit", text3, context], ["exit", content3, context]]);
    }
    return events;
  }
  function tokenizeHeadingAtx(effects, ok, nok) {
    let size = 0;
    return start;
    function start(code) {
      effects.enter("atxHeading");
      return before(code);
    }
    function before(code) {
      effects.enter("atxHeadingSequence");
      return sequenceOpen(code);
    }
    function sequenceOpen(code) {
      if (code === 35 && size++ < 6) {
        effects.consume(code);
        return sequenceOpen;
      }
      if (code === null || markdownLineEndingOrSpace(code)) {
        effects.exit("atxHeadingSequence");
        return atBreak(code);
      }
      return nok(code);
    }
    function atBreak(code) {
      if (code === 35) {
        effects.enter("atxHeadingSequence");
        return sequenceFurther(code);
      }
      if (code === null || markdownLineEnding(code)) {
        effects.exit("atxHeading");
        return ok(code);
      }
      if (markdownSpace(code)) {
        return factorySpace(effects, atBreak, "whitespace")(code);
      }
      effects.enter("atxHeadingText");
      return data(code);
    }
    function sequenceFurther(code) {
      if (code === 35) {
        effects.consume(code);
        return sequenceFurther;
      }
      effects.exit("atxHeadingSequence");
      return atBreak(code);
    }
    function data(code) {
      if (code === null || code === 35 || markdownLineEndingOrSpace(code)) {
        effects.exit("atxHeadingText");
        return atBreak(code);
      }
      effects.consume(code);
      return data;
    }
  }

  // node_modules/micromark-util-html-tag-name/index.js
  var htmlBlockNames = [
    "address",
    "article",
    "aside",
    "base",
    "basefont",
    "blockquote",
    "body",
    "caption",
    "center",
    "col",
    "colgroup",
    "dd",
    "details",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hr",
    "html",
    "iframe",
    "legend",
    "li",
    "link",
    "main",
    "menu",
    "menuitem",
    "nav",
    "noframes",
    "ol",
    "optgroup",
    "option",
    "p",
    "param",
    "search",
    "section",
    "summary",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "title",
    "tr",
    "track",
    "ul"
  ];
  var htmlRawNames = ["pre", "script", "style", "textarea"];

  // node_modules/micromark-core-commonmark/lib/html-flow.js
  var htmlFlow = {
    concrete: true,
    name: "htmlFlow",
    resolveTo: resolveToHtmlFlow,
    tokenize: tokenizeHtmlFlow
  };
  var blankLineBefore = {
    partial: true,
    tokenize: tokenizeBlankLineBefore
  };
  var nonLazyContinuationStart = {
    partial: true,
    tokenize: tokenizeNonLazyContinuationStart
  };
  function resolveToHtmlFlow(events) {
    let index2 = events.length;
    while (index2--) {
      if (events[index2][0] === "enter" && events[index2][1].type === "htmlFlow") {
        break;
      }
    }
    if (index2 > 1 && events[index2 - 2][1].type === "linePrefix") {
      events[index2][1].start = events[index2 - 2][1].start;
      events[index2 + 1][1].start = events[index2 - 2][1].start;
      events.splice(index2 - 2, 2);
    }
    return events;
  }
  function tokenizeHtmlFlow(effects, ok, nok) {
    const self = this;
    let marker;
    let closingTag;
    let buffer;
    let index2;
    let markerB;
    return start;
    function start(code) {
      return before(code);
    }
    function before(code) {
      effects.enter("htmlFlow");
      effects.enter("htmlFlowData");
      effects.consume(code);
      return open;
    }
    function open(code) {
      if (code === 33) {
        effects.consume(code);
        return declarationOpen;
      }
      if (code === 47) {
        effects.consume(code);
        closingTag = true;
        return tagCloseStart;
      }
      if (code === 63) {
        effects.consume(code);
        marker = 3;
        return self.interrupt ? ok : continuationDeclarationInside;
      }
      if (asciiAlpha(code)) {
        effects.consume(code);
        buffer = String.fromCharCode(code);
        return tagName;
      }
      return nok(code);
    }
    function declarationOpen(code) {
      if (code === 45) {
        effects.consume(code);
        marker = 2;
        return commentOpenInside;
      }
      if (code === 91) {
        effects.consume(code);
        marker = 5;
        index2 = 0;
        return cdataOpenInside;
      }
      if (asciiAlpha(code)) {
        effects.consume(code);
        marker = 4;
        return self.interrupt ? ok : continuationDeclarationInside;
      }
      return nok(code);
    }
    function commentOpenInside(code) {
      if (code === 45) {
        effects.consume(code);
        return self.interrupt ? ok : continuationDeclarationInside;
      }
      return nok(code);
    }
    function cdataOpenInside(code) {
      const value = "CDATA[";
      if (code === value.charCodeAt(index2++)) {
        effects.consume(code);
        if (index2 === value.length) {
          return self.interrupt ? ok : continuation;
        }
        return cdataOpenInside;
      }
      return nok(code);
    }
    function tagCloseStart(code) {
      if (asciiAlpha(code)) {
        effects.consume(code);
        buffer = String.fromCharCode(code);
        return tagName;
      }
      return nok(code);
    }
    function tagName(code) {
      if (code === null || code === 47 || code === 62 || markdownLineEndingOrSpace(code)) {
        const slash = code === 47;
        const name = buffer.toLowerCase();
        if (!slash && !closingTag && htmlRawNames.includes(name)) {
          marker = 1;
          return self.interrupt ? ok(code) : continuation(code);
        }
        if (htmlBlockNames.includes(buffer.toLowerCase())) {
          marker = 6;
          if (slash) {
            effects.consume(code);
            return basicSelfClosing;
          }
          return self.interrupt ? ok(code) : continuation(code);
        }
        marker = 7;
        return self.interrupt && !self.parser.lazy[self.now().line] ? nok(code) : closingTag ? completeClosingTagAfter(code) : completeAttributeNameBefore(code);
      }
      if (code === 45 || asciiAlphanumeric(code)) {
        effects.consume(code);
        buffer += String.fromCharCode(code);
        return tagName;
      }
      return nok(code);
    }
    function basicSelfClosing(code) {
      if (code === 62) {
        effects.consume(code);
        return self.interrupt ? ok : continuation;
      }
      return nok(code);
    }
    function completeClosingTagAfter(code) {
      if (markdownSpace(code)) {
        effects.consume(code);
        return completeClosingTagAfter;
      }
      return completeEnd(code);
    }
    function completeAttributeNameBefore(code) {
      if (code === 47) {
        effects.consume(code);
        return completeEnd;
      }
      if (code === 58 || code === 95 || asciiAlpha(code)) {
        effects.consume(code);
        return completeAttributeName;
      }
      if (markdownSpace(code)) {
        effects.consume(code);
        return completeAttributeNameBefore;
      }
      return completeEnd(code);
    }
    function completeAttributeName(code) {
      if (code === 45 || code === 46 || code === 58 || code === 95 || asciiAlphanumeric(code)) {
        effects.consume(code);
        return completeAttributeName;
      }
      return completeAttributeNameAfter(code);
    }
    function completeAttributeNameAfter(code) {
      if (code === 61) {
        effects.consume(code);
        return completeAttributeValueBefore;
      }
      if (markdownSpace(code)) {
        effects.consume(code);
        return completeAttributeNameAfter;
      }
      return completeAttributeNameBefore(code);
    }
    function completeAttributeValueBefore(code) {
      if (code === null || code === 60 || code === 61 || code === 62 || code === 96) {
        return nok(code);
      }
      if (code === 34 || code === 39) {
        effects.consume(code);
        markerB = code;
        return completeAttributeValueQuoted;
      }
      if (markdownSpace(code)) {
        effects.consume(code);
        return completeAttributeValueBefore;
      }
      return completeAttributeValueUnquoted(code);
    }
    function completeAttributeValueQuoted(code) {
      if (code === markerB) {
        effects.consume(code);
        markerB = null;
        return completeAttributeValueQuotedAfter;
      }
      if (code === null || markdownLineEnding(code)) {
        return nok(code);
      }
      effects.consume(code);
      return completeAttributeValueQuoted;
    }
    function completeAttributeValueUnquoted(code) {
      if (code === null || code === 34 || code === 39 || code === 47 || code === 60 || code === 61 || code === 62 || code === 96 || markdownLineEndingOrSpace(code)) {
        return completeAttributeNameAfter(code);
      }
      effects.consume(code);
      return completeAttributeValueUnquoted;
    }
    function completeAttributeValueQuotedAfter(code) {
      if (code === 47 || code === 62 || markdownSpace(code)) {
        return completeAttributeNameBefore(code);
      }
      return nok(code);
    }
    function completeEnd(code) {
      if (code === 62) {
        effects.consume(code);
        return completeAfter;
      }
      return nok(code);
    }
    function completeAfter(code) {
      if (code === null || markdownLineEnding(code)) {
        return continuation(code);
      }
      if (markdownSpace(code)) {
        effects.consume(code);
        return completeAfter;
      }
      return nok(code);
    }
    function continuation(code) {
      if (code === 45 && marker === 2) {
        effects.consume(code);
        return continuationCommentInside;
      }
      if (code === 60 && marker === 1) {
        effects.consume(code);
        return continuationRawTagOpen;
      }
      if (code === 62 && marker === 4) {
        effects.consume(code);
        return continuationClose;
      }
      if (code === 63 && marker === 3) {
        effects.consume(code);
        return continuationDeclarationInside;
      }
      if (code === 93 && marker === 5) {
        effects.consume(code);
        return continuationCdataInside;
      }
      if (markdownLineEnding(code) && (marker === 6 || marker === 7)) {
        effects.exit("htmlFlowData");
        return effects.check(blankLineBefore, continuationAfter, continuationStart)(code);
      }
      if (code === null || markdownLineEnding(code)) {
        effects.exit("htmlFlowData");
        return continuationStart(code);
      }
      effects.consume(code);
      return continuation;
    }
    function continuationStart(code) {
      return effects.check(nonLazyContinuationStart, continuationStartNonLazy, continuationAfter)(code);
    }
    function continuationStartNonLazy(code) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return continuationBefore;
    }
    function continuationBefore(code) {
      if (code === null || markdownLineEnding(code)) {
        return continuationStart(code);
      }
      effects.enter("htmlFlowData");
      return continuation(code);
    }
    function continuationCommentInside(code) {
      if (code === 45) {
        effects.consume(code);
        return continuationDeclarationInside;
      }
      return continuation(code);
    }
    function continuationRawTagOpen(code) {
      if (code === 47) {
        effects.consume(code);
        buffer = "";
        return continuationRawEndTag;
      }
      return continuation(code);
    }
    function continuationRawEndTag(code) {
      if (code === 62) {
        const name = buffer.toLowerCase();
        if (htmlRawNames.includes(name)) {
          effects.consume(code);
          return continuationClose;
        }
        return continuation(code);
      }
      if (asciiAlpha(code) && buffer.length < 8) {
        effects.consume(code);
        buffer += String.fromCharCode(code);
        return continuationRawEndTag;
      }
      return continuation(code);
    }
    function continuationCdataInside(code) {
      if (code === 93) {
        effects.consume(code);
        return continuationDeclarationInside;
      }
      return continuation(code);
    }
    function continuationDeclarationInside(code) {
      if (code === 62) {
        effects.consume(code);
        return continuationClose;
      }
      if (code === 45 && marker === 2) {
        effects.consume(code);
        return continuationDeclarationInside;
      }
      return continuation(code);
    }
    function continuationClose(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("htmlFlowData");
        return continuationAfter(code);
      }
      effects.consume(code);
      return continuationClose;
    }
    function continuationAfter(code) {
      effects.exit("htmlFlow");
      return ok(code);
    }
  }
  function tokenizeNonLazyContinuationStart(effects, ok, nok) {
    const self = this;
    return start;
    function start(code) {
      if (markdownLineEnding(code)) {
        effects.enter("lineEnding");
        effects.consume(code);
        effects.exit("lineEnding");
        return after;
      }
      return nok(code);
    }
    function after(code) {
      return self.parser.lazy[self.now().line] ? nok(code) : ok(code);
    }
  }
  function tokenizeBlankLineBefore(effects, ok, nok) {
    return start;
    function start(code) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return effects.attempt(blankLine, ok, nok);
    }
  }

  // node_modules/micromark-core-commonmark/lib/html-text.js
  var htmlText = {
    name: "htmlText",
    tokenize: tokenizeHtmlText
  };
  function tokenizeHtmlText(effects, ok, nok) {
    const self = this;
    let marker;
    let index2;
    let returnState;
    return start;
    function start(code) {
      effects.enter("htmlText");
      effects.enter("htmlTextData");
      effects.consume(code);
      return open;
    }
    function open(code) {
      if (code === 33) {
        effects.consume(code);
        return declarationOpen;
      }
      if (code === 47) {
        effects.consume(code);
        return tagCloseStart;
      }
      if (code === 63) {
        effects.consume(code);
        return instruction;
      }
      if (asciiAlpha(code)) {
        effects.consume(code);
        return tagOpen;
      }
      return nok(code);
    }
    function declarationOpen(code) {
      if (code === 45) {
        effects.consume(code);
        return commentOpenInside;
      }
      if (code === 91) {
        effects.consume(code);
        index2 = 0;
        return cdataOpenInside;
      }
      if (asciiAlpha(code)) {
        effects.consume(code);
        return declaration;
      }
      return nok(code);
    }
    function commentOpenInside(code) {
      if (code === 45) {
        effects.consume(code);
        return commentEnd;
      }
      return nok(code);
    }
    function comment(code) {
      if (code === null) {
        return nok(code);
      }
      if (code === 45) {
        effects.consume(code);
        return commentClose;
      }
      if (markdownLineEnding(code)) {
        returnState = comment;
        return lineEndingBefore(code);
      }
      effects.consume(code);
      return comment;
    }
    function commentClose(code) {
      if (code === 45) {
        effects.consume(code);
        return commentEnd;
      }
      return comment(code);
    }
    function commentEnd(code) {
      return code === 62 ? end(code) : code === 45 ? commentClose(code) : comment(code);
    }
    function cdataOpenInside(code) {
      const value = "CDATA[";
      if (code === value.charCodeAt(index2++)) {
        effects.consume(code);
        return index2 === value.length ? cdata : cdataOpenInside;
      }
      return nok(code);
    }
    function cdata(code) {
      if (code === null) {
        return nok(code);
      }
      if (code === 93) {
        effects.consume(code);
        return cdataClose;
      }
      if (markdownLineEnding(code)) {
        returnState = cdata;
        return lineEndingBefore(code);
      }
      effects.consume(code);
      return cdata;
    }
    function cdataClose(code) {
      if (code === 93) {
        effects.consume(code);
        return cdataEnd;
      }
      return cdata(code);
    }
    function cdataEnd(code) {
      if (code === 62) {
        return end(code);
      }
      if (code === 93) {
        effects.consume(code);
        return cdataEnd;
      }
      return cdata(code);
    }
    function declaration(code) {
      if (code === null || code === 62) {
        return end(code);
      }
      if (markdownLineEnding(code)) {
        returnState = declaration;
        return lineEndingBefore(code);
      }
      effects.consume(code);
      return declaration;
    }
    function instruction(code) {
      if (code === null) {
        return nok(code);
      }
      if (code === 63) {
        effects.consume(code);
        return instructionClose;
      }
      if (markdownLineEnding(code)) {
        returnState = instruction;
        return lineEndingBefore(code);
      }
      effects.consume(code);
      return instruction;
    }
    function instructionClose(code) {
      return code === 62 ? end(code) : instruction(code);
    }
    function tagCloseStart(code) {
      if (asciiAlpha(code)) {
        effects.consume(code);
        return tagClose;
      }
      return nok(code);
    }
    function tagClose(code) {
      if (code === 45 || asciiAlphanumeric(code)) {
        effects.consume(code);
        return tagClose;
      }
      return tagCloseBetween(code);
    }
    function tagCloseBetween(code) {
      if (markdownLineEnding(code)) {
        returnState = tagCloseBetween;
        return lineEndingBefore(code);
      }
      if (markdownSpace(code)) {
        effects.consume(code);
        return tagCloseBetween;
      }
      return end(code);
    }
    function tagOpen(code) {
      if (code === 45 || asciiAlphanumeric(code)) {
        effects.consume(code);
        return tagOpen;
      }
      if (code === 47 || code === 62 || markdownLineEndingOrSpace(code)) {
        return tagOpenBetween(code);
      }
      return nok(code);
    }
    function tagOpenBetween(code) {
      if (code === 47) {
        effects.consume(code);
        return end;
      }
      if (code === 58 || code === 95 || asciiAlpha(code)) {
        effects.consume(code);
        return tagOpenAttributeName;
      }
      if (markdownLineEnding(code)) {
        returnState = tagOpenBetween;
        return lineEndingBefore(code);
      }
      if (markdownSpace(code)) {
        effects.consume(code);
        return tagOpenBetween;
      }
      return end(code);
    }
    function tagOpenAttributeName(code) {
      if (code === 45 || code === 46 || code === 58 || code === 95 || asciiAlphanumeric(code)) {
        effects.consume(code);
        return tagOpenAttributeName;
      }
      return tagOpenAttributeNameAfter(code);
    }
    function tagOpenAttributeNameAfter(code) {
      if (code === 61) {
        effects.consume(code);
        return tagOpenAttributeValueBefore;
      }
      if (markdownLineEnding(code)) {
        returnState = tagOpenAttributeNameAfter;
        return lineEndingBefore(code);
      }
      if (markdownSpace(code)) {
        effects.consume(code);
        return tagOpenAttributeNameAfter;
      }
      return tagOpenBetween(code);
    }
    function tagOpenAttributeValueBefore(code) {
      if (code === null || code === 60 || code === 61 || code === 62 || code === 96) {
        return nok(code);
      }
      if (code === 34 || code === 39) {
        effects.consume(code);
        marker = code;
        return tagOpenAttributeValueQuoted;
      }
      if (markdownLineEnding(code)) {
        returnState = tagOpenAttributeValueBefore;
        return lineEndingBefore(code);
      }
      if (markdownSpace(code)) {
        effects.consume(code);
        return tagOpenAttributeValueBefore;
      }
      effects.consume(code);
      return tagOpenAttributeValueUnquoted;
    }
    function tagOpenAttributeValueQuoted(code) {
      if (code === marker) {
        effects.consume(code);
        marker = void 0;
        return tagOpenAttributeValueQuotedAfter;
      }
      if (code === null) {
        return nok(code);
      }
      if (markdownLineEnding(code)) {
        returnState = tagOpenAttributeValueQuoted;
        return lineEndingBefore(code);
      }
      effects.consume(code);
      return tagOpenAttributeValueQuoted;
    }
    function tagOpenAttributeValueUnquoted(code) {
      if (code === null || code === 34 || code === 39 || code === 60 || code === 61 || code === 96) {
        return nok(code);
      }
      if (code === 47 || code === 62 || markdownLineEndingOrSpace(code)) {
        return tagOpenBetween(code);
      }
      effects.consume(code);
      return tagOpenAttributeValueUnquoted;
    }
    function tagOpenAttributeValueQuotedAfter(code) {
      if (code === 47 || code === 62 || markdownLineEndingOrSpace(code)) {
        return tagOpenBetween(code);
      }
      return nok(code);
    }
    function end(code) {
      if (code === 62) {
        effects.consume(code);
        effects.exit("htmlTextData");
        effects.exit("htmlText");
        return ok;
      }
      return nok(code);
    }
    function lineEndingBefore(code) {
      effects.exit("htmlTextData");
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return lineEndingAfter;
    }
    function lineEndingAfter(code) {
      return markdownSpace(code) ? factorySpace(effects, lineEndingAfterPrefix, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code) : lineEndingAfterPrefix(code);
    }
    function lineEndingAfterPrefix(code) {
      effects.enter("htmlTextData");
      return returnState(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/label-end.js
  var labelEnd = {
    name: "labelEnd",
    resolveAll: resolveAllLabelEnd,
    resolveTo: resolveToLabelEnd,
    tokenize: tokenizeLabelEnd
  };
  var resourceConstruct = {
    tokenize: tokenizeResource
  };
  var referenceFullConstruct = {
    tokenize: tokenizeReferenceFull
  };
  var referenceCollapsedConstruct = {
    tokenize: tokenizeReferenceCollapsed
  };
  function resolveAllLabelEnd(events) {
    let index2 = -1;
    const newEvents = [];
    while (++index2 < events.length) {
      const token = events[index2][1];
      newEvents.push(events[index2]);
      if (token.type === "labelImage" || token.type === "labelLink" || token.type === "labelEnd") {
        const offset = token.type === "labelImage" ? 4 : 2;
        token.type = "data";
        index2 += offset;
      }
    }
    if (events.length !== newEvents.length) {
      splice(events, 0, events.length, newEvents);
    }
    return events;
  }
  function resolveToLabelEnd(events, context) {
    let index2 = events.length;
    let offset = 0;
    let token;
    let open;
    let close;
    let media;
    while (index2--) {
      token = events[index2][1];
      if (open) {
        if (token.type === "link" || token.type === "labelLink" && token._inactive) {
          break;
        }
        if (events[index2][0] === "enter" && token.type === "labelLink") {
          token._inactive = true;
        }
      } else if (close) {
        if (events[index2][0] === "enter" && (token.type === "labelImage" || token.type === "labelLink") && !token._balanced) {
          open = index2;
          if (token.type !== "labelLink") {
            offset = 2;
            break;
          }
        }
      } else if (token.type === "labelEnd") {
        close = index2;
      }
    }
    const group = {
      type: events[open][1].type === "labelLink" ? "link" : "image",
      start: {
        ...events[open][1].start
      },
      end: {
        ...events[events.length - 1][1].end
      }
    };
    const label = {
      type: "label",
      start: {
        ...events[open][1].start
      },
      end: {
        ...events[close][1].end
      }
    };
    const text3 = {
      type: "labelText",
      start: {
        ...events[open + offset + 2][1].end
      },
      end: {
        ...events[close - 2][1].start
      }
    };
    media = [["enter", group, context], ["enter", label, context]];
    media = push(media, events.slice(open + 1, open + offset + 3));
    media = push(media, [["enter", text3, context]]);
    media = push(media, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + offset + 4, close - 3), context));
    media = push(media, [["exit", text3, context], events[close - 2], events[close - 1], ["exit", label, context]]);
    media = push(media, events.slice(close + 1));
    media = push(media, [["exit", group, context]]);
    splice(events, open, events.length, media);
    return events;
  }
  function tokenizeLabelEnd(effects, ok, nok) {
    const self = this;
    let index2 = self.events.length;
    let labelStart;
    let defined;
    while (index2--) {
      if ((self.events[index2][1].type === "labelImage" || self.events[index2][1].type === "labelLink") && !self.events[index2][1]._balanced) {
        labelStart = self.events[index2][1];
        break;
      }
    }
    return start;
    function start(code) {
      if (!labelStart) {
        return nok(code);
      }
      if (labelStart._inactive) {
        return labelEndNok(code);
      }
      defined = self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize({
        start: labelStart.end,
        end: self.now()
      })));
      effects.enter("labelEnd");
      effects.enter("labelMarker");
      effects.consume(code);
      effects.exit("labelMarker");
      effects.exit("labelEnd");
      return after;
    }
    function after(code) {
      if (code === 40) {
        return effects.attempt(resourceConstruct, labelEndOk, defined ? labelEndOk : labelEndNok)(code);
      }
      if (code === 91) {
        return effects.attempt(referenceFullConstruct, labelEndOk, defined ? referenceNotFull : labelEndNok)(code);
      }
      return defined ? labelEndOk(code) : labelEndNok(code);
    }
    function referenceNotFull(code) {
      return effects.attempt(referenceCollapsedConstruct, labelEndOk, labelEndNok)(code);
    }
    function labelEndOk(code) {
      return ok(code);
    }
    function labelEndNok(code) {
      labelStart._balanced = true;
      return nok(code);
    }
  }
  function tokenizeResource(effects, ok, nok) {
    return resourceStart;
    function resourceStart(code) {
      effects.enter("resource");
      effects.enter("resourceMarker");
      effects.consume(code);
      effects.exit("resourceMarker");
      return resourceBefore;
    }
    function resourceBefore(code) {
      return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceOpen)(code) : resourceOpen(code);
    }
    function resourceOpen(code) {
      if (code === 41) {
        return resourceEnd(code);
      }
      return factoryDestination(effects, resourceDestinationAfter, resourceDestinationMissing, "resourceDestination", "resourceDestinationLiteral", "resourceDestinationLiteralMarker", "resourceDestinationRaw", "resourceDestinationString", 32)(code);
    }
    function resourceDestinationAfter(code) {
      return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceBetween)(code) : resourceEnd(code);
    }
    function resourceDestinationMissing(code) {
      return nok(code);
    }
    function resourceBetween(code) {
      if (code === 34 || code === 39 || code === 40) {
        return factoryTitle(effects, resourceTitleAfter, nok, "resourceTitle", "resourceTitleMarker", "resourceTitleString")(code);
      }
      return resourceEnd(code);
    }
    function resourceTitleAfter(code) {
      return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceEnd)(code) : resourceEnd(code);
    }
    function resourceEnd(code) {
      if (code === 41) {
        effects.enter("resourceMarker");
        effects.consume(code);
        effects.exit("resourceMarker");
        effects.exit("resource");
        return ok;
      }
      return nok(code);
    }
  }
  function tokenizeReferenceFull(effects, ok, nok) {
    const self = this;
    return referenceFull;
    function referenceFull(code) {
      return factoryLabel.call(self, effects, referenceFullAfter, referenceFullMissing, "reference", "referenceMarker", "referenceString")(code);
    }
    function referenceFullAfter(code) {
      return self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1))) ? ok(code) : nok(code);
    }
    function referenceFullMissing(code) {
      return nok(code);
    }
  }
  function tokenizeReferenceCollapsed(effects, ok, nok) {
    return referenceCollapsedStart;
    function referenceCollapsedStart(code) {
      effects.enter("reference");
      effects.enter("referenceMarker");
      effects.consume(code);
      effects.exit("referenceMarker");
      return referenceCollapsedOpen;
    }
    function referenceCollapsedOpen(code) {
      if (code === 93) {
        effects.enter("referenceMarker");
        effects.consume(code);
        effects.exit("referenceMarker");
        effects.exit("reference");
        return ok;
      }
      return nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/label-start-image.js
  var labelStartImage = {
    name: "labelStartImage",
    resolveAll: labelEnd.resolveAll,
    tokenize: tokenizeLabelStartImage
  };
  function tokenizeLabelStartImage(effects, ok, nok) {
    const self = this;
    return start;
    function start(code) {
      effects.enter("labelImage");
      effects.enter("labelImageMarker");
      effects.consume(code);
      effects.exit("labelImageMarker");
      return open;
    }
    function open(code) {
      if (code === 91) {
        effects.enter("labelMarker");
        effects.consume(code);
        effects.exit("labelMarker");
        effects.exit("labelImage");
        return after;
      }
      return nok(code);
    }
    function after(code) {
      return code === 94 && "_hiddenFootnoteSupport" in self.parser.constructs ? nok(code) : ok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/label-start-link.js
  var labelStartLink = {
    name: "labelStartLink",
    resolveAll: labelEnd.resolveAll,
    tokenize: tokenizeLabelStartLink
  };
  function tokenizeLabelStartLink(effects, ok, nok) {
    const self = this;
    return start;
    function start(code) {
      effects.enter("labelLink");
      effects.enter("labelMarker");
      effects.consume(code);
      effects.exit("labelMarker");
      effects.exit("labelLink");
      return after;
    }
    function after(code) {
      return code === 94 && "_hiddenFootnoteSupport" in self.parser.constructs ? nok(code) : ok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/line-ending.js
  var lineEnding = {
    name: "lineEnding",
    tokenize: tokenizeLineEnding
  };
  function tokenizeLineEnding(effects, ok) {
    return start;
    function start(code) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return factorySpace(effects, ok, "linePrefix");
    }
  }

  // node_modules/micromark-core-commonmark/lib/thematic-break.js
  var thematicBreak = {
    name: "thematicBreak",
    tokenize: tokenizeThematicBreak
  };
  function tokenizeThematicBreak(effects, ok, nok) {
    let size = 0;
    let marker;
    return start;
    function start(code) {
      effects.enter("thematicBreak");
      return before(code);
    }
    function before(code) {
      marker = code;
      return atBreak(code);
    }
    function atBreak(code) {
      if (code === marker) {
        effects.enter("thematicBreakSequence");
        return sequence(code);
      }
      if (size >= 3 && (code === null || markdownLineEnding(code))) {
        effects.exit("thematicBreak");
        return ok(code);
      }
      return nok(code);
    }
    function sequence(code) {
      if (code === marker) {
        effects.consume(code);
        size++;
        return sequence;
      }
      effects.exit("thematicBreakSequence");
      return markdownSpace(code) ? factorySpace(effects, atBreak, "whitespace")(code) : atBreak(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/list.js
  var list = {
    continuation: {
      tokenize: tokenizeListContinuation
    },
    exit: tokenizeListEnd,
    name: "list",
    tokenize: tokenizeListStart
  };
  var listItemPrefixWhitespaceConstruct = {
    partial: true,
    tokenize: tokenizeListItemPrefixWhitespace
  };
  var indentConstruct = {
    partial: true,
    tokenize: tokenizeIndent
  };
  function tokenizeListStart(effects, ok, nok) {
    const self = this;
    const tail = self.events[self.events.length - 1];
    let initialSize = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
    let size = 0;
    return start;
    function start(code) {
      const kind = self.containerState.type || (code === 42 || code === 43 || code === 45 ? "listUnordered" : "listOrdered");
      if (kind === "listUnordered" ? !self.containerState.marker || code === self.containerState.marker : asciiDigit(code)) {
        if (!self.containerState.type) {
          self.containerState.type = kind;
          effects.enter(kind, {
            _container: true
          });
        }
        if (kind === "listUnordered") {
          effects.enter("listItemPrefix");
          return code === 42 || code === 45 ? effects.check(thematicBreak, nok, atMarker)(code) : atMarker(code);
        }
        if (!self.interrupt || code === 49) {
          effects.enter("listItemPrefix");
          effects.enter("listItemValue");
          return inside(code);
        }
      }
      return nok(code);
    }
    function inside(code) {
      if (asciiDigit(code) && ++size < 10) {
        effects.consume(code);
        return inside;
      }
      if ((!self.interrupt || size < 2) && (self.containerState.marker ? code === self.containerState.marker : code === 41 || code === 46)) {
        effects.exit("listItemValue");
        return atMarker(code);
      }
      return nok(code);
    }
    function atMarker(code) {
      effects.enter("listItemMarker");
      effects.consume(code);
      effects.exit("listItemMarker");
      self.containerState.marker = self.containerState.marker || code;
      return effects.check(
        blankLine,
        // Can’t be empty when interrupting.
        self.interrupt ? nok : onBlank,
        effects.attempt(listItemPrefixWhitespaceConstruct, endOfPrefix, otherPrefix)
      );
    }
    function onBlank(code) {
      self.containerState.initialBlankLine = true;
      initialSize++;
      return endOfPrefix(code);
    }
    function otherPrefix(code) {
      if (markdownSpace(code)) {
        effects.enter("listItemPrefixWhitespace");
        effects.consume(code);
        effects.exit("listItemPrefixWhitespace");
        return endOfPrefix;
      }
      return nok(code);
    }
    function endOfPrefix(code) {
      self.containerState.size = initialSize + self.sliceSerialize(effects.exit("listItemPrefix"), true).length;
      return ok(code);
    }
  }
  function tokenizeListContinuation(effects, ok, nok) {
    const self = this;
    self.containerState._closeFlow = void 0;
    return effects.check(blankLine, onBlank, notBlank);
    function onBlank(code) {
      self.containerState.furtherBlankLines = self.containerState.furtherBlankLines || self.containerState.initialBlankLine;
      return factorySpace(effects, ok, "listItemIndent", self.containerState.size + 1)(code);
    }
    function notBlank(code) {
      if (self.containerState.furtherBlankLines || !markdownSpace(code)) {
        self.containerState.furtherBlankLines = void 0;
        self.containerState.initialBlankLine = void 0;
        return notInCurrentItem(code);
      }
      self.containerState.furtherBlankLines = void 0;
      self.containerState.initialBlankLine = void 0;
      return effects.attempt(indentConstruct, ok, notInCurrentItem)(code);
    }
    function notInCurrentItem(code) {
      self.containerState._closeFlow = true;
      self.interrupt = void 0;
      return factorySpace(effects, effects.attempt(list, ok, nok), "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code);
    }
  }
  function tokenizeIndent(effects, ok, nok) {
    const self = this;
    return factorySpace(effects, afterPrefix, "listItemIndent", self.containerState.size + 1);
    function afterPrefix(code) {
      const tail = self.events[self.events.length - 1];
      return tail && tail[1].type === "listItemIndent" && tail[2].sliceSerialize(tail[1], true).length === self.containerState.size ? ok(code) : nok(code);
    }
  }
  function tokenizeListEnd(effects) {
    effects.exit(this.containerState.type);
  }
  function tokenizeListItemPrefixWhitespace(effects, ok, nok) {
    const self = this;
    return factorySpace(effects, afterPrefix, "listItemPrefixWhitespace", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4 + 1);
    function afterPrefix(code) {
      const tail = self.events[self.events.length - 1];
      return !markdownSpace(code) && tail && tail[1].type === "listItemPrefixWhitespace" ? ok(code) : nok(code);
    }
  }

  // node_modules/micromark-core-commonmark/lib/setext-underline.js
  var setextUnderline = {
    name: "setextUnderline",
    resolveTo: resolveToSetextUnderline,
    tokenize: tokenizeSetextUnderline
  };
  function resolveToSetextUnderline(events, context) {
    let index2 = events.length;
    let content3;
    let text3;
    let definition2;
    while (index2--) {
      if (events[index2][0] === "enter") {
        if (events[index2][1].type === "content") {
          content3 = index2;
          break;
        }
        if (events[index2][1].type === "paragraph") {
          text3 = index2;
        }
      } else {
        if (events[index2][1].type === "content") {
          events.splice(index2, 1);
        }
        if (!definition2 && events[index2][1].type === "definition") {
          definition2 = index2;
        }
      }
    }
    const heading = {
      type: "setextHeading",
      start: {
        ...events[content3][1].start
      },
      end: {
        ...events[events.length - 1][1].end
      }
    };
    events[text3][1].type = "setextHeadingText";
    if (definition2) {
      events.splice(text3, 0, ["enter", heading, context]);
      events.splice(definition2 + 1, 0, ["exit", events[content3][1], context]);
      events[content3][1].end = {
        ...events[definition2][1].end
      };
    } else {
      events[content3][1] = heading;
    }
    events.push(["exit", heading, context]);
    return events;
  }
  function tokenizeSetextUnderline(effects, ok, nok) {
    const self = this;
    let marker;
    return start;
    function start(code) {
      let index2 = self.events.length;
      let paragraph;
      while (index2--) {
        if (self.events[index2][1].type !== "lineEnding" && self.events[index2][1].type !== "linePrefix" && self.events[index2][1].type !== "content") {
          paragraph = self.events[index2][1].type === "paragraph";
          break;
        }
      }
      if (!self.parser.lazy[self.now().line] && (self.interrupt || paragraph)) {
        effects.enter("setextHeadingLine");
        marker = code;
        return before(code);
      }
      return nok(code);
    }
    function before(code) {
      effects.enter("setextHeadingLineSequence");
      return inside(code);
    }
    function inside(code) {
      if (code === marker) {
        effects.consume(code);
        return inside;
      }
      effects.exit("setextHeadingLineSequence");
      return markdownSpace(code) ? factorySpace(effects, after, "lineSuffix")(code) : after(code);
    }
    function after(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("setextHeadingLine");
        return ok(code);
      }
      return nok(code);
    }
  }

  // node_modules/micromark/lib/initialize/flow.js
  var flow = {
    tokenize: initializeFlow
  };
  function initializeFlow(effects) {
    const self = this;
    const initial = effects.attempt(
      // Try to parse a blank line.
      blankLine,
      atBlankEnding,
      // Try to parse initial flow (essentially, only code).
      effects.attempt(this.parser.constructs.flowInitial, afterConstruct, factorySpace(effects, effects.attempt(this.parser.constructs.flow, afterConstruct, effects.attempt(content2, afterConstruct)), "linePrefix"))
    );
    return initial;
    function atBlankEnding(code) {
      if (code === null) {
        effects.consume(code);
        return;
      }
      effects.enter("lineEndingBlank");
      effects.consume(code);
      effects.exit("lineEndingBlank");
      self.currentConstruct = void 0;
      return initial;
    }
    function afterConstruct(code) {
      if (code === null) {
        effects.consume(code);
        return;
      }
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      self.currentConstruct = void 0;
      return initial;
    }
  }

  // node_modules/micromark/lib/initialize/text.js
  var resolver = {
    resolveAll: createResolver()
  };
  var string = initializeFactory("string");
  var text = initializeFactory("text");
  function initializeFactory(field) {
    return {
      resolveAll: createResolver(field === "text" ? resolveAllLineSuffixes : void 0),
      tokenize: initializeText
    };
    function initializeText(effects) {
      const self = this;
      const constructs2 = this.parser.constructs[field];
      const text3 = effects.attempt(constructs2, start, notText);
      return start;
      function start(code) {
        return atBreak(code) ? text3(code) : notText(code);
      }
      function notText(code) {
        if (code === null) {
          effects.consume(code);
          return;
        }
        effects.enter("data");
        effects.consume(code);
        return data;
      }
      function data(code) {
        if (atBreak(code)) {
          effects.exit("data");
          return text3(code);
        }
        effects.consume(code);
        return data;
      }
      function atBreak(code) {
        if (code === null) {
          return true;
        }
        const list2 = constructs2[code];
        let index2 = -1;
        if (list2) {
          while (++index2 < list2.length) {
            const item = list2[index2];
            if (!item.previous || item.previous.call(self, self.previous)) {
              return true;
            }
          }
        }
        return false;
      }
    }
  }
  function createResolver(extraResolver) {
    return resolveAllText;
    function resolveAllText(events, context) {
      let index2 = -1;
      let enter;
      while (++index2 <= events.length) {
        if (enter === void 0) {
          if (events[index2] && events[index2][1].type === "data") {
            enter = index2;
            index2++;
          }
        } else if (!events[index2] || events[index2][1].type !== "data") {
          if (index2 !== enter + 2) {
            events[enter][1].end = events[index2 - 1][1].end;
            events.splice(enter + 2, index2 - enter - 2);
            index2 = enter + 2;
          }
          enter = void 0;
        }
      }
      return extraResolver ? extraResolver(events, context) : events;
    }
  }
  function resolveAllLineSuffixes(events, context) {
    let eventIndex = 0;
    while (++eventIndex <= events.length) {
      if ((eventIndex === events.length || events[eventIndex][1].type === "lineEnding") && events[eventIndex - 1][1].type === "data") {
        const data = events[eventIndex - 1][1];
        const chunks = context.sliceStream(data);
        let index2 = chunks.length;
        let bufferIndex = -1;
        let size = 0;
        let tabs;
        while (index2--) {
          const chunk = chunks[index2];
          if (typeof chunk === "string") {
            bufferIndex = chunk.length;
            while (chunk.charCodeAt(bufferIndex - 1) === 32) {
              size++;
              bufferIndex--;
            }
            if (bufferIndex)
              break;
            bufferIndex = -1;
          } else if (chunk === -2) {
            tabs = true;
            size++;
          } else if (chunk === -1) {
          } else {
            index2++;
            break;
          }
        }
        if (context._contentTypeTextTrailing && eventIndex === events.length) {
          size = 0;
        }
        if (size) {
          const token = {
            type: eventIndex === events.length || tabs || size < 2 ? "lineSuffix" : "hardBreakTrailing",
            start: {
              _bufferIndex: index2 ? bufferIndex : data.start._bufferIndex + bufferIndex,
              _index: data.start._index + index2,
              line: data.end.line,
              column: data.end.column - size,
              offset: data.end.offset - size
            },
            end: {
              ...data.end
            }
          };
          data.end = {
            ...token.start
          };
          if (data.start.offset === data.end.offset) {
            Object.assign(data, token);
          } else {
            events.splice(eventIndex, 0, ["enter", token, context], ["exit", token, context]);
            eventIndex += 2;
          }
        }
        eventIndex++;
      }
    }
    return events;
  }

  // node_modules/micromark/lib/constructs.js
  var constructs_exports = {};
  __export(constructs_exports, {
    attentionMarkers: () => attentionMarkers,
    contentInitial: () => contentInitial,
    disable: () => disable,
    document: () => document3,
    flow: () => flow2,
    flowInitial: () => flowInitial,
    insideSpan: () => insideSpan,
    string: () => string2,
    text: () => text2
  });
  var document3 = {
    [42]: list,
    [43]: list,
    [45]: list,
    [48]: list,
    [49]: list,
    [50]: list,
    [51]: list,
    [52]: list,
    [53]: list,
    [54]: list,
    [55]: list,
    [56]: list,
    [57]: list,
    [62]: blockQuote
  };
  var contentInitial = {
    [91]: definition
  };
  var flowInitial = {
    [-2]: codeIndented,
    [-1]: codeIndented,
    [32]: codeIndented
  };
  var flow2 = {
    [35]: headingAtx,
    [42]: thematicBreak,
    [45]: [setextUnderline, thematicBreak],
    [60]: htmlFlow,
    [61]: setextUnderline,
    [95]: thematicBreak,
    [96]: codeFenced,
    [126]: codeFenced
  };
  var string2 = {
    [38]: characterReference,
    [92]: characterEscape
  };
  var text2 = {
    [-5]: lineEnding,
    [-4]: lineEnding,
    [-3]: lineEnding,
    [33]: labelStartImage,
    [38]: characterReference,
    [42]: attention,
    [60]: [autolink, htmlText],
    [91]: labelStartLink,
    [92]: [hardBreakEscape, characterEscape],
    [93]: labelEnd,
    [95]: attention,
    [96]: codeText
  };
  var insideSpan = {
    null: [attention, resolver]
  };
  var attentionMarkers = {
    null: [42, 95]
  };
  var disable = {
    null: []
  };

  // node_modules/micromark/lib/create-tokenizer.js
  function createTokenizer(parser, initialize, from) {
    let point3 = {
      _bufferIndex: -1,
      _index: 0,
      line: from && from.line || 1,
      column: from && from.column || 1,
      offset: from && from.offset || 0
    };
    const columnStart = {};
    const resolveAllConstructs = [];
    let chunks = [];
    let stack = [];
    let consumed = true;
    const effects = {
      attempt: constructFactory(onsuccessfulconstruct),
      check: constructFactory(onsuccessfulcheck),
      consume,
      enter,
      exit: exit2,
      interrupt: constructFactory(onsuccessfulcheck, {
        interrupt: true
      })
    };
    const context = {
      code: null,
      containerState: {},
      defineSkip,
      events: [],
      now,
      parser,
      previous: null,
      sliceSerialize,
      sliceStream,
      write
    };
    let state = initialize.tokenize.call(context, effects);
    let expectedCode;
    if (initialize.resolveAll) {
      resolveAllConstructs.push(initialize);
    }
    return context;
    function write(slice) {
      chunks = push(chunks, slice);
      main();
      if (chunks[chunks.length - 1] !== null) {
        return [];
      }
      addResult(initialize, 0);
      context.events = resolveAll(resolveAllConstructs, context.events, context);
      return context.events;
    }
    function sliceSerialize(token, expandTabs) {
      return serializeChunks(sliceStream(token), expandTabs);
    }
    function sliceStream(token) {
      return sliceChunks(chunks, token);
    }
    function now() {
      const {
        _bufferIndex,
        _index,
        line,
        column,
        offset
      } = point3;
      return {
        _bufferIndex,
        _index,
        line,
        column,
        offset
      };
    }
    function defineSkip(value) {
      columnStart[value.line] = value.column;
      accountForPotentialSkip();
    }
    function main() {
      let chunkIndex;
      while (point3._index < chunks.length) {
        const chunk = chunks[point3._index];
        if (typeof chunk === "string") {
          chunkIndex = point3._index;
          if (point3._bufferIndex < 0) {
            point3._bufferIndex = 0;
          }
          while (point3._index === chunkIndex && point3._bufferIndex < chunk.length) {
            go(chunk.charCodeAt(point3._bufferIndex));
          }
        } else {
          go(chunk);
        }
      }
    }
    function go(code) {
      consumed = void 0;
      expectedCode = code;
      state = state(code);
    }
    function consume(code) {
      if (markdownLineEnding(code)) {
        point3.line++;
        point3.column = 1;
        point3.offset += code === -3 ? 2 : 1;
        accountForPotentialSkip();
      } else if (code !== -1) {
        point3.column++;
        point3.offset++;
      }
      if (point3._bufferIndex < 0) {
        point3._index++;
      } else {
        point3._bufferIndex++;
        if (point3._bufferIndex === // Points w/ non-negative `_bufferIndex` reference
        // strings.
        /** @type {string} */
        chunks[point3._index].length) {
          point3._bufferIndex = -1;
          point3._index++;
        }
      }
      context.previous = code;
      consumed = true;
    }
    function enter(type, fields) {
      const token = fields || {};
      token.type = type;
      token.start = now();
      context.events.push(["enter", token, context]);
      stack.push(token);
      return token;
    }
    function exit2(type) {
      const token = stack.pop();
      token.end = now();
      context.events.push(["exit", token, context]);
      return token;
    }
    function onsuccessfulconstruct(construct, info) {
      addResult(construct, info.from);
    }
    function onsuccessfulcheck(_, info) {
      info.restore();
    }
    function constructFactory(onreturn, fields) {
      return hook;
      function hook(constructs2, returnState, bogusState) {
        let listOfConstructs;
        let constructIndex;
        let currentConstruct;
        let info;
        return Array.isArray(constructs2) ? (
          /* c8 ignore next 1 */
          handleListOfConstructs(constructs2)
        ) : "tokenize" in constructs2 ? (
          // Looks like a construct.
          handleListOfConstructs([
            /** @type {Construct} */
            constructs2
          ])
        ) : handleMapOfConstructs(constructs2);
        function handleMapOfConstructs(map) {
          return start;
          function start(code) {
            const left = code !== null && map[code];
            const all2 = code !== null && map.null;
            const list2 = [
              // To do: add more extension tests.
              /* c8 ignore next 2 */
              ...Array.isArray(left) ? left : left ? [left] : [],
              ...Array.isArray(all2) ? all2 : all2 ? [all2] : []
            ];
            return handleListOfConstructs(list2)(code);
          }
        }
        function handleListOfConstructs(list2) {
          listOfConstructs = list2;
          constructIndex = 0;
          if (list2.length === 0) {
            return bogusState;
          }
          return handleConstruct(list2[constructIndex]);
        }
        function handleConstruct(construct) {
          return start;
          function start(code) {
            info = store();
            currentConstruct = construct;
            if (!construct.partial) {
              context.currentConstruct = construct;
            }
            if (construct.name && context.parser.constructs.disable.null.includes(construct.name)) {
              return nok(code);
            }
            return construct.tokenize.call(
              // If we do have fields, create an object w/ `context` as its
              // prototype.
              // This allows a “live binding”, which is needed for `interrupt`.
              fields ? Object.assign(Object.create(context), fields) : context,
              effects,
              ok,
              nok
            )(code);
          }
        }
        function ok(code) {
          consumed = true;
          onreturn(currentConstruct, info);
          return returnState;
        }
        function nok(code) {
          consumed = true;
          info.restore();
          if (++constructIndex < listOfConstructs.length) {
            return handleConstruct(listOfConstructs[constructIndex]);
          }
          return bogusState;
        }
      }
    }
    function addResult(construct, from2) {
      if (construct.resolveAll && !resolveAllConstructs.includes(construct)) {
        resolveAllConstructs.push(construct);
      }
      if (construct.resolve) {
        splice(context.events, from2, context.events.length - from2, construct.resolve(context.events.slice(from2), context));
      }
      if (construct.resolveTo) {
        context.events = construct.resolveTo(context.events, context);
      }
    }
    function store() {
      const startPoint = now();
      const startPrevious = context.previous;
      const startCurrentConstruct = context.currentConstruct;
      const startEventsIndex = context.events.length;
      const startStack = Array.from(stack);
      return {
        from: startEventsIndex,
        restore
      };
      function restore() {
        point3 = startPoint;
        context.previous = startPrevious;
        context.currentConstruct = startCurrentConstruct;
        context.events.length = startEventsIndex;
        stack = startStack;
        accountForPotentialSkip();
      }
    }
    function accountForPotentialSkip() {
      if (point3.line in columnStart && point3.column < 2) {
        point3.column = columnStart[point3.line];
        point3.offset += columnStart[point3.line] - 1;
      }
    }
  }
  function sliceChunks(chunks, token) {
    const startIndex = token.start._index;
    const startBufferIndex = token.start._bufferIndex;
    const endIndex = token.end._index;
    const endBufferIndex = token.end._bufferIndex;
    let view;
    if (startIndex === endIndex) {
      view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)];
    } else {
      view = chunks.slice(startIndex, endIndex);
      if (startBufferIndex > -1) {
        const head = view[0];
        if (typeof head === "string") {
          view[0] = head.slice(startBufferIndex);
        } else {
          view.shift();
        }
      }
      if (endBufferIndex > 0) {
        view.push(chunks[endIndex].slice(0, endBufferIndex));
      }
    }
    return view;
  }
  function serializeChunks(chunks, expandTabs) {
    let index2 = -1;
    const result = [];
    let atTab;
    while (++index2 < chunks.length) {
      const chunk = chunks[index2];
      let value;
      if (typeof chunk === "string") {
        value = chunk;
      } else
        switch (chunk) {
          case -5: {
            value = "\r";
            break;
          }
          case -4: {
            value = "\n";
            break;
          }
          case -3: {
            value = "\r\n";
            break;
          }
          case -2: {
            value = expandTabs ? " " : "	";
            break;
          }
          case -1: {
            if (!expandTabs && atTab)
              continue;
            value = " ";
            break;
          }
          default: {
            value = String.fromCharCode(chunk);
          }
        }
      atTab = chunk === -2;
      result.push(value);
    }
    return result.join("");
  }

  // node_modules/micromark/lib/parse.js
  function parse(options) {
    const settings = options || {};
    const constructs2 = (
      /** @type {FullNormalizedExtension} */
      combineExtensions([constructs_exports, ...settings.extensions || []])
    );
    const parser = {
      constructs: constructs2,
      content: create(content),
      defined: [],
      document: create(document2),
      flow: create(flow),
      lazy: {},
      string: create(string),
      text: create(text)
    };
    return parser;
    function create(initial) {
      return creator;
      function creator(from) {
        return createTokenizer(parser, initial, from);
      }
    }
  }

  // node_modules/micromark/lib/postprocess.js
  function postprocess(events) {
    while (!subtokenize(events)) {
    }
    return events;
  }

  // node_modules/micromark/lib/preprocess.js
  var search = /[\0\t\n\r]/g;
  function preprocess() {
    let column = 1;
    let buffer = "";
    let start = true;
    let atCarriageReturn;
    return preprocessor;
    function preprocessor(value, encoding, end) {
      const chunks = [];
      let match;
      let next;
      let startPosition;
      let endPosition;
      let code;
      value = buffer + (typeof value === "string" ? value.toString() : new TextDecoder(encoding || void 0).decode(value));
      startPosition = 0;
      buffer = "";
      if (start) {
        if (value.charCodeAt(0) === 65279) {
          startPosition++;
        }
        start = void 0;
      }
      while (startPosition < value.length) {
        search.lastIndex = startPosition;
        match = search.exec(value);
        endPosition = match && match.index !== void 0 ? match.index : value.length;
        code = value.charCodeAt(endPosition);
        if (!match) {
          buffer = value.slice(startPosition);
          break;
        }
        if (code === 10 && startPosition === endPosition && atCarriageReturn) {
          chunks.push(-3);
          atCarriageReturn = void 0;
        } else {
          if (atCarriageReturn) {
            chunks.push(-5);
            atCarriageReturn = void 0;
          }
          if (startPosition < endPosition) {
            chunks.push(value.slice(startPosition, endPosition));
            column += endPosition - startPosition;
          }
          switch (code) {
            case 0: {
              chunks.push(65533);
              column++;
              break;
            }
            case 9: {
              next = Math.ceil(column / 4) * 4;
              chunks.push(-2);
              while (column++ < next)
                chunks.push(-1);
              break;
            }
            case 10: {
              chunks.push(-4);
              column = 1;
              break;
            }
            default: {
              atCarriageReturn = true;
              column = 1;
            }
          }
        }
        startPosition = endPosition + 1;
      }
      if (end) {
        if (atCarriageReturn)
          chunks.push(-5);
        if (buffer)
          chunks.push(buffer);
        chunks.push(null);
      }
      return chunks;
    }
  }

  // node_modules/micromark-util-decode-string/index.js
  var characterEscapeOrReference = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
  function decodeString(value) {
    return value.replace(characterEscapeOrReference, decode);
  }
  function decode($0, $1, $2) {
    if ($1) {
      return $1;
    }
    const head = $2.charCodeAt(0);
    if (head === 35) {
      const head2 = $2.charCodeAt(1);
      const hex = head2 === 120 || head2 === 88;
      return decodeNumericCharacterReference($2.slice(hex ? 2 : 1), hex ? 16 : 10);
    }
    return decodeNamedCharacterReference($2) || $0;
  }

  // node_modules/unist-util-stringify-position/lib/index.js
  function stringifyPosition(value) {
    if (!value || typeof value !== "object") {
      return "";
    }
    if ("position" in value || "type" in value) {
      return position(value.position);
    }
    if ("start" in value || "end" in value) {
      return position(value);
    }
    if ("line" in value || "column" in value) {
      return point(value);
    }
    return "";
  }
  function point(point3) {
    return index(point3 && point3.line) + ":" + index(point3 && point3.column);
  }
  function position(pos) {
    return point(pos && pos.start) + "-" + point(pos && pos.end);
  }
  function index(value) {
    return value && typeof value === "number" ? value : 1;
  }

  // node_modules/mdast-util-from-markdown/lib/index.js
  var own = {}.hasOwnProperty;
  function fromMarkdown(value, encoding, options) {
    if (encoding && typeof encoding === "object") {
      options = encoding;
      encoding = void 0;
    }
    return compiler(options)(postprocess(parse(options).document().write(preprocess()(value, encoding, true))));
  }
  function compiler(options) {
    const config = {
      transforms: [],
      canContainEols: ["emphasis", "fragment", "heading", "paragraph", "strong"],
      enter: {
        autolink: opener(link),
        autolinkProtocol: onenterdata,
        autolinkEmail: onenterdata,
        atxHeading: opener(heading),
        blockQuote: opener(blockQuote2),
        characterEscape: onenterdata,
        characterReference: onenterdata,
        codeFenced: opener(codeFlow),
        codeFencedFenceInfo: buffer,
        codeFencedFenceMeta: buffer,
        codeIndented: opener(codeFlow, buffer),
        codeText: opener(codeText2, buffer),
        codeTextData: onenterdata,
        data: onenterdata,
        codeFlowValue: onenterdata,
        definition: opener(definition2),
        definitionDestinationString: buffer,
        definitionLabelString: buffer,
        definitionTitleString: buffer,
        emphasis: opener(emphasis),
        hardBreakEscape: opener(hardBreak),
        hardBreakTrailing: opener(hardBreak),
        htmlFlow: opener(html, buffer),
        htmlFlowData: onenterdata,
        htmlText: opener(html, buffer),
        htmlTextData: onenterdata,
        image: opener(image),
        label: buffer,
        link: opener(link),
        listItem: opener(listItem),
        listItemValue: onenterlistitemvalue,
        listOrdered: opener(list2, onenterlistordered),
        listUnordered: opener(list2),
        paragraph: opener(paragraph),
        reference: onenterreference,
        referenceString: buffer,
        resourceDestinationString: buffer,
        resourceTitleString: buffer,
        setextHeading: opener(heading),
        strong: opener(strong),
        thematicBreak: opener(thematicBreak2)
      },
      exit: {
        atxHeading: closer(),
        atxHeadingSequence: onexitatxheadingsequence,
        autolink: closer(),
        autolinkEmail: onexitautolinkemail,
        autolinkProtocol: onexitautolinkprotocol,
        blockQuote: closer(),
        characterEscapeValue: onexitdata,
        characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
        characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
        characterReferenceValue: onexitcharacterreferencevalue,
        characterReference: onexitcharacterreference,
        codeFenced: closer(onexitcodefenced),
        codeFencedFence: onexitcodefencedfence,
        codeFencedFenceInfo: onexitcodefencedfenceinfo,
        codeFencedFenceMeta: onexitcodefencedfencemeta,
        codeFlowValue: onexitdata,
        codeIndented: closer(onexitcodeindented),
        codeText: closer(onexitcodetext),
        codeTextData: onexitdata,
        data: onexitdata,
        definition: closer(),
        definitionDestinationString: onexitdefinitiondestinationstring,
        definitionLabelString: onexitdefinitionlabelstring,
        definitionTitleString: onexitdefinitiontitlestring,
        emphasis: closer(),
        hardBreakEscape: closer(onexithardbreak),
        hardBreakTrailing: closer(onexithardbreak),
        htmlFlow: closer(onexithtmlflow),
        htmlFlowData: onexitdata,
        htmlText: closer(onexithtmltext),
        htmlTextData: onexitdata,
        image: closer(onexitimage),
        label: onexitlabel,
        labelText: onexitlabeltext,
        lineEnding: onexitlineending,
        link: closer(onexitlink),
        listItem: closer(),
        listOrdered: closer(),
        listUnordered: closer(),
        paragraph: closer(),
        referenceString: onexitreferencestring,
        resourceDestinationString: onexitresourcedestinationstring,
        resourceTitleString: onexitresourcetitlestring,
        resource: onexitresource,
        setextHeading: closer(onexitsetextheading),
        setextHeadingLineSequence: onexitsetextheadinglinesequence,
        setextHeadingText: onexitsetextheadingtext,
        strong: closer(),
        thematicBreak: closer()
      }
    };
    configure(config, (options || {}).mdastExtensions || []);
    const data = {};
    return compile;
    function compile(events) {
      let tree = {
        type: "root",
        children: []
      };
      const context = {
        stack: [tree],
        tokenStack: [],
        config,
        enter,
        exit: exit2,
        buffer,
        resume,
        data
      };
      const listStack = [];
      let index2 = -1;
      while (++index2 < events.length) {
        if (events[index2][1].type === "listOrdered" || events[index2][1].type === "listUnordered") {
          if (events[index2][0] === "enter") {
            listStack.push(index2);
          } else {
            const tail = listStack.pop();
            index2 = prepareList(events, tail, index2);
          }
        }
      }
      index2 = -1;
      while (++index2 < events.length) {
        const handler = config[events[index2][0]];
        if (own.call(handler, events[index2][1].type)) {
          handler[events[index2][1].type].call(Object.assign({
            sliceSerialize: events[index2][2].sliceSerialize
          }, context), events[index2][1]);
        }
      }
      if (context.tokenStack.length > 0) {
        const tail = context.tokenStack[context.tokenStack.length - 1];
        const handler = tail[1] || defaultOnError;
        handler.call(context, void 0, tail[0]);
      }
      tree.position = {
        start: point2(events.length > 0 ? events[0][1].start : {
          line: 1,
          column: 1,
          offset: 0
        }),
        end: point2(events.length > 0 ? events[events.length - 2][1].end : {
          line: 1,
          column: 1,
          offset: 0
        })
      };
      index2 = -1;
      while (++index2 < config.transforms.length) {
        tree = config.transforms[index2](tree) || tree;
      }
      return tree;
    }
    function prepareList(events, start, length) {
      let index2 = start - 1;
      let containerBalance = -1;
      let listSpread = false;
      let listItem2;
      let lineIndex;
      let firstBlankLineIndex;
      let atMarker;
      while (++index2 <= length) {
        const event = events[index2];
        switch (event[1].type) {
          case "listUnordered":
          case "listOrdered":
          case "blockQuote": {
            if (event[0] === "enter") {
              containerBalance++;
            } else {
              containerBalance--;
            }
            atMarker = void 0;
            break;
          }
          case "lineEndingBlank": {
            if (event[0] === "enter") {
              if (listItem2 && !atMarker && !containerBalance && !firstBlankLineIndex) {
                firstBlankLineIndex = index2;
              }
              atMarker = void 0;
            }
            break;
          }
          case "linePrefix":
          case "listItemValue":
          case "listItemMarker":
          case "listItemPrefix":
          case "listItemPrefixWhitespace": {
            break;
          }
          default: {
            atMarker = void 0;
          }
        }
        if (!containerBalance && event[0] === "enter" && event[1].type === "listItemPrefix" || containerBalance === -1 && event[0] === "exit" && (event[1].type === "listUnordered" || event[1].type === "listOrdered")) {
          if (listItem2) {
            let tailIndex = index2;
            lineIndex = void 0;
            while (tailIndex--) {
              const tailEvent = events[tailIndex];
              if (tailEvent[1].type === "lineEnding" || tailEvent[1].type === "lineEndingBlank") {
                if (tailEvent[0] === "exit")
                  continue;
                if (lineIndex) {
                  events[lineIndex][1].type = "lineEndingBlank";
                  listSpread = true;
                }
                tailEvent[1].type = "lineEnding";
                lineIndex = tailIndex;
              } else if (tailEvent[1].type === "linePrefix" || tailEvent[1].type === "blockQuotePrefix" || tailEvent[1].type === "blockQuotePrefixWhitespace" || tailEvent[1].type === "blockQuoteMarker" || tailEvent[1].type === "listItemIndent") {
              } else {
                break;
              }
            }
            if (firstBlankLineIndex && (!lineIndex || firstBlankLineIndex < lineIndex)) {
              listItem2._spread = true;
            }
            listItem2.end = Object.assign({}, lineIndex ? events[lineIndex][1].start : event[1].end);
            events.splice(lineIndex || index2, 0, ["exit", listItem2, event[2]]);
            index2++;
            length++;
          }
          if (event[1].type === "listItemPrefix") {
            const item = {
              type: "listItem",
              _spread: false,
              start: Object.assign({}, event[1].start),
              // @ts-expect-error: we’ll add `end` in a second.
              end: void 0
            };
            listItem2 = item;
            events.splice(index2, 0, ["enter", item, event[2]]);
            index2++;
            length++;
            firstBlankLineIndex = void 0;
            atMarker = true;
          }
        }
      }
      events[start][1]._spread = listSpread;
      return length;
    }
    function opener(create, and) {
      return open;
      function open(token) {
        enter.call(this, create(token), token);
        if (and)
          and.call(this, token);
      }
    }
    function buffer() {
      this.stack.push({
        type: "fragment",
        children: []
      });
    }
    function enter(node2, token, errorHandler) {
      const parent = this.stack[this.stack.length - 1];
      const siblings = parent.children;
      siblings.push(node2);
      this.stack.push(node2);
      this.tokenStack.push([token, errorHandler || void 0]);
      node2.position = {
        start: point2(token.start),
        // @ts-expect-error: `end` will be patched later.
        end: void 0
      };
    }
    function closer(and) {
      return close;
      function close(token) {
        if (and)
          and.call(this, token);
        exit2.call(this, token);
      }
    }
    function exit2(token, onExitError) {
      const node2 = this.stack.pop();
      const open = this.tokenStack.pop();
      if (!open) {
        throw new Error("Cannot close `" + token.type + "` (" + stringifyPosition({
          start: token.start,
          end: token.end
        }) + "): it\u2019s not open");
      } else if (open[0].type !== token.type) {
        if (onExitError) {
          onExitError.call(this, token, open[0]);
        } else {
          const handler = open[1] || defaultOnError;
          handler.call(this, token, open[0]);
        }
      }
      node2.position.end = point2(token.end);
    }
    function resume() {
      return toString(this.stack.pop());
    }
    function onenterlistordered() {
      this.data.expectingFirstListItemValue = true;
    }
    function onenterlistitemvalue(token) {
      if (this.data.expectingFirstListItemValue) {
        const ancestor = this.stack[this.stack.length - 2];
        ancestor.start = Number.parseInt(this.sliceSerialize(token), 10);
        this.data.expectingFirstListItemValue = void 0;
      }
    }
    function onexitcodefencedfenceinfo() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.lang = data2;
    }
    function onexitcodefencedfencemeta() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.meta = data2;
    }
    function onexitcodefencedfence() {
      if (this.data.flowCodeInside)
        return;
      this.buffer();
      this.data.flowCodeInside = true;
    }
    function onexitcodefenced() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.value = data2.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
      this.data.flowCodeInside = void 0;
    }
    function onexitcodeindented() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.value = data2.replace(/(\r?\n|\r)$/g, "");
    }
    function onexitdefinitionlabelstring(token) {
      const label = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.label = label;
      node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
    }
    function onexitdefinitiontitlestring() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.title = data2;
    }
    function onexitdefinitiondestinationstring() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.url = data2;
    }
    function onexitatxheadingsequence(token) {
      const node2 = this.stack[this.stack.length - 1];
      if (!node2.depth) {
        const depth = this.sliceSerialize(token).length;
        node2.depth = depth;
      }
    }
    function onexitsetextheadingtext() {
      this.data.setextHeadingSlurpLineEnding = true;
    }
    function onexitsetextheadinglinesequence(token) {
      const node2 = this.stack[this.stack.length - 1];
      node2.depth = this.sliceSerialize(token).codePointAt(0) === 61 ? 1 : 2;
    }
    function onexitsetextheading() {
      this.data.setextHeadingSlurpLineEnding = void 0;
    }
    function onenterdata(token) {
      const node2 = this.stack[this.stack.length - 1];
      const siblings = node2.children;
      let tail = siblings[siblings.length - 1];
      if (!tail || tail.type !== "text") {
        tail = text3();
        tail.position = {
          start: point2(token.start),
          // @ts-expect-error: we’ll add `end` later.
          end: void 0
        };
        siblings.push(tail);
      }
      this.stack.push(tail);
    }
    function onexitdata(token) {
      const tail = this.stack.pop();
      tail.value += this.sliceSerialize(token);
      tail.position.end = point2(token.end);
    }
    function onexitlineending(token) {
      const context = this.stack[this.stack.length - 1];
      if (this.data.atHardBreak) {
        const tail = context.children[context.children.length - 1];
        tail.position.end = point2(token.end);
        this.data.atHardBreak = void 0;
        return;
      }
      if (!this.data.setextHeadingSlurpLineEnding && config.canContainEols.includes(context.type)) {
        onenterdata.call(this, token);
        onexitdata.call(this, token);
      }
    }
    function onexithardbreak() {
      this.data.atHardBreak = true;
    }
    function onexithtmlflow() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.value = data2;
    }
    function onexithtmltext() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.value = data2;
    }
    function onexitcodetext() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.value = data2;
    }
    function onexitlink() {
      const node2 = this.stack[this.stack.length - 1];
      if (this.data.inReference) {
        const referenceType = this.data.referenceType || "shortcut";
        node2.type += "Reference";
        node2.referenceType = referenceType;
        delete node2.url;
        delete node2.title;
      } else {
        delete node2.identifier;
        delete node2.label;
      }
      this.data.referenceType = void 0;
    }
    function onexitimage() {
      const node2 = this.stack[this.stack.length - 1];
      if (this.data.inReference) {
        const referenceType = this.data.referenceType || "shortcut";
        node2.type += "Reference";
        node2.referenceType = referenceType;
        delete node2.url;
        delete node2.title;
      } else {
        delete node2.identifier;
        delete node2.label;
      }
      this.data.referenceType = void 0;
    }
    function onexitlabeltext(token) {
      const string3 = this.sliceSerialize(token);
      const ancestor = this.stack[this.stack.length - 2];
      ancestor.label = decodeString(string3);
      ancestor.identifier = normalizeIdentifier(string3).toLowerCase();
    }
    function onexitlabel() {
      const fragment = this.stack[this.stack.length - 1];
      const value = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      this.data.inReference = true;
      if (node2.type === "link") {
        const children = fragment.children;
        node2.children = children;
      } else {
        node2.alt = value;
      }
    }
    function onexitresourcedestinationstring() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.url = data2;
    }
    function onexitresourcetitlestring() {
      const data2 = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.title = data2;
    }
    function onexitresource() {
      this.data.inReference = void 0;
    }
    function onenterreference() {
      this.data.referenceType = "collapsed";
    }
    function onexitreferencestring(token) {
      const label = this.resume();
      const node2 = this.stack[this.stack.length - 1];
      node2.label = label;
      node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
      this.data.referenceType = "full";
    }
    function onexitcharacterreferencemarker(token) {
      this.data.characterReferenceType = token.type;
    }
    function onexitcharacterreferencevalue(token) {
      const data2 = this.sliceSerialize(token);
      const type = this.data.characterReferenceType;
      let value;
      if (type) {
        value = decodeNumericCharacterReference(data2, type === "characterReferenceMarkerNumeric" ? 10 : 16);
        this.data.characterReferenceType = void 0;
      } else {
        const result = decodeNamedCharacterReference(data2);
        value = result;
      }
      const tail = this.stack[this.stack.length - 1];
      tail.value += value;
    }
    function onexitcharacterreference(token) {
      const tail = this.stack.pop();
      tail.position.end = point2(token.end);
    }
    function onexitautolinkprotocol(token) {
      onexitdata.call(this, token);
      const node2 = this.stack[this.stack.length - 1];
      node2.url = this.sliceSerialize(token);
    }
    function onexitautolinkemail(token) {
      onexitdata.call(this, token);
      const node2 = this.stack[this.stack.length - 1];
      node2.url = "mailto:" + this.sliceSerialize(token);
    }
    function blockQuote2() {
      return {
        type: "blockquote",
        children: []
      };
    }
    function codeFlow() {
      return {
        type: "code",
        lang: null,
        meta: null,
        value: ""
      };
    }
    function codeText2() {
      return {
        type: "inlineCode",
        value: ""
      };
    }
    function definition2() {
      return {
        type: "definition",
        identifier: "",
        label: null,
        title: null,
        url: ""
      };
    }
    function emphasis() {
      return {
        type: "emphasis",
        children: []
      };
    }
    function heading() {
      return {
        type: "heading",
        // @ts-expect-error `depth` will be set later.
        depth: 0,
        children: []
      };
    }
    function hardBreak() {
      return {
        type: "break"
      };
    }
    function html() {
      return {
        type: "html",
        value: ""
      };
    }
    function image() {
      return {
        type: "image",
        title: null,
        url: "",
        alt: null
      };
    }
    function link() {
      return {
        type: "link",
        title: null,
        url: "",
        children: []
      };
    }
    function list2(token) {
      return {
        type: "list",
        ordered: token.type === "listOrdered",
        start: null,
        spread: token._spread,
        children: []
      };
    }
    function listItem(token) {
      return {
        type: "listItem",
        spread: token._spread,
        checked: null,
        children: []
      };
    }
    function paragraph() {
      return {
        type: "paragraph",
        children: []
      };
    }
    function strong() {
      return {
        type: "strong",
        children: []
      };
    }
    function text3() {
      return {
        type: "text",
        value: ""
      };
    }
    function thematicBreak2() {
      return {
        type: "thematicBreak"
      };
    }
  }
  function point2(d) {
    return {
      line: d.line,
      column: d.column,
      offset: d.offset
    };
  }
  function configure(combined, extensions) {
    let index2 = -1;
    while (++index2 < extensions.length) {
      const value = extensions[index2];
      if (Array.isArray(value)) {
        configure(combined, value);
      } else {
        extension(combined, value);
      }
    }
  }
  function extension(combined, extension2) {
    let key;
    for (key in extension2) {
      if (own.call(extension2, key)) {
        switch (key) {
          case "canContainEols": {
            const right = extension2[key];
            if (right) {
              combined[key].push(...right);
            }
            break;
          }
          case "transforms": {
            const right = extension2[key];
            if (right) {
              combined[key].push(...right);
            }
            break;
          }
          case "enter":
          case "exit": {
            const right = extension2[key];
            if (right) {
              Object.assign(combined[key], right);
            }
            break;
          }
        }
      }
    }
  }
  function defaultOnError(left, right) {
    if (left) {
      throw new Error("Cannot close `" + left.type + "` (" + stringifyPosition({
        start: left.start,
        end: left.end
      }) + "): a different token (`" + right.type + "`, " + stringifyPosition({
        start: right.start,
        end: right.end
      }) + ") is open");
    } else {
      throw new Error("Cannot close document, a token (`" + right.type + "`, " + stringifyPosition({
        start: right.start,
        end: right.end
      }) + ") is still open");
    }
  }

  // web/src/root.js
  var _root = document;
  function setRoot(shadowRoot) {
    _root = shadowRoot;
  }
  function getRoot() {
    return _root;
  }

  // web/src/description.js
  function renderDescription(markdown, target) {
    var container = target || getRoot().getElementById("foggy-description");
    container.textContent = "";
    if (!markdown) {
      return;
    }
    var tree = fromMarkdown(markdown);
    container.appendChild(renderNodes(tree.children || []));
  }
  function renderNodes(nodes) {
    var fragment = document.createDocumentFragment();
    nodes.forEach(function(node2) {
      var rendered = renderNode(node2);
      if (rendered) {
        fragment.appendChild(rendered);
      }
    });
    return fragment;
  }
  function renderNode(node2) {
    if (!node2 || typeof node2.type !== "string") {
      return null;
    }
    switch (node2.type) {
      case "text":
        return document.createTextNode(node2.value || "");
      case "paragraph":
        return renderElement("p", node2.children);
      case "heading":
        return renderHeading(node2);
      case "strong":
        return renderElement("strong", node2.children);
      case "emphasis":
        return renderElement("em", node2.children);
      case "inlineCode":
        return renderCode(node2.value || "");
      case "code":
        return renderCodeBlock(node2.value || "", node2.lang || "");
      case "break":
        return document.createElement("br");
      case "blockquote":
        return renderElement("blockquote", node2.children);
      case "list":
        return renderList(node2);
      case "listItem":
        return renderElement("li", node2.children);
      case "link":
        return renderLink(node2);
      default:
        if (Array.isArray(node2.children)) {
          return renderNodes(node2.children);
        }
        return null;
    }
  }
  function renderElement(tagName, children) {
    var element2 = document.createElement(tagName);
    element2.appendChild(renderNodes(children || []));
    return element2;
  }
  function renderHeading(node2) {
    var depth = Number(node2.depth) || 1;
    var tagName = "h" + Math.min(Math.max(depth, 1), 6);
    return renderElement(tagName, node2.children);
  }
  function renderCode(value) {
    var code = document.createElement("code");
    code.textContent = value;
    return code;
  }
  function renderCodeBlock(value, lang) {
    var pre = document.createElement("pre");
    var code = renderCode(value);
    if (lang) {
      code.setAttribute("data-language", lang);
    }
    pre.appendChild(code);
    return pre;
  }
  function renderList(node2) {
    var listTag = node2.ordered ? "ol" : "ul";
    return renderElement(listTag, node2.children);
  }
  function renderLink(node2) {
    var href = typeof node2.url === "string" ? node2.url : "";
    if (!isSafeHref(href)) {
      return renderNodes(node2.children || []);
    }
    var link = document.createElement("a");
    link.setAttribute("href", href);
    link.setAttribute("rel", "noreferrer noopener");
    link.appendChild(renderNodes(node2.children || []));
    return link;
  }
  function isSafeHref(href) {
    try {
      var url = new URL(href, window.location.href);
      return ["http:", "https:", "mailto:"].indexOf(url.protocol) !== -1;
    } catch (error) {
      return false;
    }
  }

  // web/src/storage.js
  function getStoredCode(codeStorageKey) {
    if (!codeStorageKey || !window.sessionStorage) {
      return null;
    }
    try {
      return window.sessionStorage.getItem(codeStorageKey);
    } catch (error) {
      return null;
    }
  }
  function storeCode(codeStorageKey, code) {
    if (!codeStorageKey || !window.sessionStorage) {
      return;
    }
    try {
      window.sessionStorage.setItem(codeStorageKey, code);
    } catch (error) {
    }
  }

  // web/src/editor.js
  function initEditor(cardData, codeStorageKey) {
    var starterCode = getStoredCode(codeStorageKey) || cardData.starterCode || "";
    var editorView = createCodeMirror(getRoot().getElementById("foggy-editor"), starterCode, {
      language: cardData.language,
      onChange: function(update) {
        if (update.docChanged) {
          storeCode(codeStorageKey, update.state.doc.toString());
        }
      }
    });
    editorView.focus();
    return editorView;
  }
  function createCodeMirror(parent, doc, options) {
    var codeMirror = window.CodeMirror;
    var extensions = getBaseExtensions(codeMirror, options).concat([
      getLanguageExtension(codeMirror, options && options.language),
      codeMirror.oneDark,
      codeMirror.EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" }
      })
    ]);
    if (options && options.readOnly) {
      extensions.push(codeMirror.EditorState.readOnly.of(true));
      extensions.push(codeMirror.EditorView.editable.of(false));
    } else {
      extensions.push(codeMirror.keymap.of([codeMirror.indentWithTab]));
    }
    if (options && typeof options.onChange === "function") {
      extensions.push(
        codeMirror.EditorView.updateListener.of(function(update) {
          options.onChange(update);
        })
      );
    }
    return new codeMirror.EditorView({
      state: codeMirror.EditorState.create({
        doc: doc || "",
        extensions
      }),
      parent
    });
  }
  function getBaseExtensions(codeMirror, options) {
    if (!options || options.showGutters !== false || !Array.isArray(codeMirror.basicSetup)) {
      return [codeMirror.basicSetup];
    }
    return codeMirror.basicSetup.filter(function(_extension, index2) {
      return index2 !== 0 && index2 !== 1 && index2 !== 4;
    });
  }
  function getLanguageExtension(codeMirror, language) {
    var normalizedLanguage = (language || "python").toLowerCase();
    switch (normalizedLanguage) {
      case "python":
      default:
        return codeMirror.python();
    }
  }

  // web/src/format.js
  function hasDisplayValue(value) {
    return value !== void 0 && !(typeof value === "string" && value.length === 0);
  }
  function formatJsonValue(value) {
    if (value === void 0) {
      return "undefined";
    }
    var serialized = JSON.stringify(value);
    return serialized === void 0 ? String(value) : serialized;
  }
  function formatSerializedResult(value) {
    if (!hasDisplayValue(value)) {
      return "";
    }
    if (typeof value !== "string") {
      return formatJsonValue(value);
    }
    try {
      return formatJsonValue(JSON.parse(value));
    } catch (error) {
      return value;
    }
  }

  // web/src/ui.js
  function setHidden(element2, hidden) {
    if (element2) {
      element2.classList.toggle("is-hidden", hidden);
    }
  }
  function renderHint(container, text3) {
    var hint = document.createElement("span");
    hint.className = "foggy-hint";
    hint.textContent = text3;
    container.replaceChildren(hint);
  }
  function createDetailSection(title) {
    var section = document.createElement("section");
    section.className = "foggy-detail-section";
    var heading = document.createElement("div");
    heading.className = "foggy-detail-heading";
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  }
  function createDetailField(label, valueText, modifierClass) {
    var field = document.createElement("div");
    field.className = "foggy-case-field";
    if (label) {
      var labelEl = document.createElement("div");
      labelEl.className = "foggy-case-label";
      labelEl.textContent = label;
      field.appendChild(labelEl);
    } else {
      field.classList.add("foggy-case-field--plain");
    }
    var value = document.createElement("div");
    value.className = "foggy-case-value";
    if (modifierClass) {
      value.classList.add(modifierClass);
    }
    value.textContent = valueText;
    field.appendChild(value);
    return field;
  }
  function renderInputSection(parent, inputs) {
    if (!inputs.length) {
      return;
    }
    var section = createDetailSection("Input");
    var stack = document.createElement("div");
    stack.className = "foggy-detail-stack";
    inputs.forEach(function(input) {
      stack.appendChild(createDetailField(input.label, input.value));
    });
    section.appendChild(stack);
    parent.appendChild(section);
  }
  function renderValueSection(parent, title, valueText, modifierClass) {
    if (!hasDisplayValue(valueText)) {
      return;
    }
    var section = createDetailSection(title);
    section.appendChild(createDetailField("", valueText, modifierClass));
    parent.appendChild(section);
  }

  // web/src/header.js
  function initHeader(cardData) {
    var headerTitle = getRoot().getElementById("foggy-header-title");
    var headerState = getRoot().getElementById("foggy-header-state");
    var langBadge = getRoot().getElementById("foggy-lang-badge");
    var diffBadge = getRoot().getElementById("foggy-difficulty-badge");
    var title = cardData.title || "Foggy";
    var isMcq = cardData.kind === "mcq";
    var diff = (cardData.difficulty || "").toLowerCase();
    headerTitle.textContent = isMcq ? "MCQ" : title;
    headerState.textContent = cardData.isAnswer ? "Answer" : "Practice";
    setHidden(headerTitle, true);
    setHidden(headerState, true);
    if (cardData.language) {
      langBadge.textContent = cardData.language;
      setHidden(langBadge, false);
    } else {
      langBadge.textContent = "";
      setHidden(langBadge, true);
    }
    diffBadge.textContent = cardData.difficulty || "";
    diffBadge.classList.remove("easy", "medium", "hard");
    if (diff) {
      diffBadge.classList.add(diff);
    }
    setHidden(diffBadge, true);
  }

  // web/src/icons.js
  var ICON_SVGS = {
    close: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    description: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8.5H12M7 12H15M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.5708 20C19.8328 20 20.8568 18.977 20.8568 17.714V13.143L21.9998 12L20.8568 10.857V6.286C20.8568 5.023 19.8338 4 18.5708 4M5.429 4C4.166 4 3.143 5.023 3.143 6.286V10.857L2 12L3.143 13.143V17.714C3.143 18.977 4.166 20 5.429 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    testcase: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 10.5L11 12.5L15.5 8M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "test-result": '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 9H2M6 17.5L8.5 15L6 12.5M11 17.5L15 17.5M2 7.8L2 16.2C2 17.8802 2 18.7202 2.32698 19.362C2.6146 19.9265 3.07354 20.3854 3.63803 20.673C4.27976 21 5.11984 21 6.8 21H17.2C18.8802 21 19.7202 21 20.362 20.673C20.9265 20.3854 21.3854 19.9265 21.673 19.362C22 18.7202 22 17.8802 22 16.2V7.8C22 6.11984 22 5.27977 21.673 4.63803C21.3854 4.07354 20.9265 3.6146 20.362 3.32698C19.7202 3 18.8802 3 17.2 3L6.8 3C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    solution: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6V10.5012C9 11.0521 9 11.3276 8.93132 11.5829C8.87047 11.809 8.77037 12.0228 8.63557 12.2143C8.48344 12.4305 8.27182 12.6068 7.84859 12.9595L4.15141 16.0405C3.72818 16.3932 3.51656 16.5695 3.36443 16.7857C3.22963 16.9772 3.12953 17.191 3.06868 17.4171C3 17.6724 3 17.9479 3 18.4988V18.8C3 19.9201 3 20.4802 3.21799 20.908C3.40973 21.2843 3.71569 21.5903 4.09202 21.782C4.51984 22 5.0799 22 6.2 22H17.8C18.9201 22 19.4802 22 19.908 21.782C20.2843 21.5903 20.5903 21.2843 20.782 20.908C21 20.4802 21 19.9201 21 18.8V18.4988C21 17.9479 21 17.6724 20.9313 17.4171C20.8705 17.191 20.7704 16.9772 20.6356 16.7857C20.4834 16.5695 20.2718 16.3932 19.8486 16.0405L16.1514 12.9595C15.7282 12.6068 15.5166 12.4305 15.3644 12.2143C15.2296 12.0228 15.1295 11.809 15.0687 11.5829C15 11.3276 15 11.0521 15 10.5012V6M8.3 6H15.7C15.98 6 16.12 6 16.227 5.9455C16.3211 5.89757 16.3976 5.82108 16.4455 5.727C16.5 5.62004 16.5 5.48003 16.5 5.2V2.8C16.5 2.51997 16.5 2.37996 16.4455 2.273C16.3976 2.17892 16.3211 2.10243 16.227 2.0545C16.12 2 15.98 2 15.7 2H8.3C8.01997 2 7.87996 2 7.773 2.0545C7.67892 2.10243 7.60243 2.17892 7.5545 2.273C7.5 2.37996 7.5 2.51997 7.5 2.8V5.2C7.5 5.48003 7.5 5.62004 7.5545 5.727C7.60243 5.82108 7.67892 5.89757 7.773 5.9455C7.87996 6 8.01997 6 8.3 6ZM5.5 17H18.5C18.9647 17 19.197 17 19.3902 17.0384C20.1836 17.1962 20.8038 17.8164 20.9616 18.6098C21 18.803 21 19.0353 21 19.5C21 19.9647 21 20.197 20.9616 20.3902C20.8038 21.1836 20.1836 21.8038 19.3902 21.9616C19.197 22 18.9647 22 18.5 22H5.5C5.03534 22 4.80302 22 4.60982 21.9616C3.81644 21.8038 3.19624 21.1836 3.03843 20.3902C3 20.197 3 19.9647 3 19.5C3 19.0353 3 18.803 3.03843 18.6098C3.19624 17.8164 3.81644 17.1962 4.60982 17.0384C4.80302 17 5.03534 17 5.5 17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 4.875C1.5 3.01104 3.01104 1.5 4.875 1.5C6.20018 1.5 7.34838 2.26364 7.901 3.37829C8.1902 3.96162 8.79547 4.5 9.60112 4.5H12.25C13.4926 4.5 14.5 5.50736 14.5 6.75C14.5 7.42688 14.202 8.03329 13.7276 8.44689L13.1622 8.93972L14.1479 10.0704L14.7133 9.57758C15.5006 8.89123 16 7.8785 16 6.75C16 4.67893 14.3211 3 12.25 3H9.60112C9.51183 3 9.35322 2.93049 9.2449 2.71201C8.44888 1.1064 6.79184 0 4.875 0C2.18261 0 0 2.18261 0 4.875V6.40385C0 7.69502 0.598275 8.84699 1.52982 9.59656L2.11415 10.0667L3.0545 8.89808L2.47018 8.42791C1.87727 7.95083 1.5 7.22166 1.5 6.40385V4.875ZM7.29289 7.39645C7.68342 7.00592 8.31658 7.00592 8.70711 7.39645L11.7803 10.4697L12.3107 11L11.25 12.0607L10.7197 11.5303L8.75 9.56066V15.25V16H7.25V15.25V9.56066L5.28033 11.5303L4.75 12.0607L3.68934 11L4.21967 10.4697L7.29289 7.39645Z" fill="currentColor"/></svg>'
  };
  function initIcons() {
    getRoot().querySelectorAll("[data-icon]").forEach(function(iconEl) {
      var iconName = iconEl.getAttribute("data-icon");
      var svg = ICON_SVGS[iconName];
      if (!svg) {
        console.warn("Unknown Foggy icon:", iconName);
        return;
      }
      iconEl.innerHTML = svg;
    });
  }

  // web/src/layout.js
  function initSplitGrid() {
    var splitGrid = window.SplitGrid && window.SplitGrid.default ? window.SplitGrid.default : window.SplitGrid;
    if (!splitGrid) {
      console.warn("SplitGrid not loaded");
      return;
    }
    splitGrid({
      columnGutters: [
        {
          track: 1,
          element: getRoot().getElementById("foggy-gutter-col")
        }
      ],
      columnMinSizes: { 0: 200, 2: 300 }
    });
    splitGrid({
      rowGutters: [
        {
          track: 1,
          element: getRoot().getElementById("foggy-gutter-row")
        }
      ],
      rowMinSizes: { 0: 36, 2: 36 }
    });
  }

  // web/src/mcq.js
  var FIRST_TRY_RATINGS = [
    { ease: 2, label: "Hard", cls: "hard" },
    { ease: 4, label: "Easy", cls: "easy" }
  ];
  function initMcqCard(cardData) {
    var choiceConfig = buildChoices(cardData.choices);
    var state = {
      cardData,
      choices: shuffleChoices(choiceConfig.choices),
      hasValidAnswer: choiceConfig.valid,
      hadWrongAttempt: false,
      solvedOnFirstTry: false,
      selectedId: null
    };
    prepareLayout(cardData);
    bindPrimaryAction(state);
    bindRatingActions();
    renderMcq(state);
  }
  function prepareLayout(cardData) {
    var container = getRoot().getElementById("foggy-container");
    var grid = getRoot().getElementById("foggy-grid");
    var mcqView = getRoot().getElementById("foggy-mcq-view");
    var headerRun = getRoot().getElementById("foggy-run-btn");
    var headerCheck = getRoot().getElementById("foggy-check-btn");
    var question = getRoot().getElementById("foggy-mcq-question");
    var description = getRoot().getElementById("foggy-mcq-description");
    container.classList.add("foggy-container--mcq");
    setHidden(grid, true);
    setHidden(mcqView, false);
    setHidden(headerRun, true);
    setHidden(headerCheck, true);
    question.textContent = cardData.question || cardData.title || "Untitled question";
    if (cardData.description) {
      renderDescription(cardData.description, description);
    } else {
      description.replaceChildren();
    }
    setHidden(description, !cardData.description);
  }
  function bindPrimaryAction(state) {
    var button = getRoot().getElementById("foggy-mcq-primary-btn");
    button.addEventListener("click", function() {
      handlePrimaryAction(state);
    });
  }
  function bindRatingActions() {
    var row = getRoot().getElementById("foggy-mcq-rating-row");
    row.replaceChildren();
    FIRST_TRY_RATINGS.forEach(function(rating) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "foggy-rating-btn foggy-rating-btn--" + rating.cls;
      button.textContent = rating.label;
      button.addEventListener("click", function() {
        answerCard(rating.ease);
      });
      row.appendChild(button);
    });
  }
  function handlePrimaryAction(state) {
    if (!state.hasValidAnswer || !state.selectedId) {
      return;
    }
    var selectedChoice = findChoice(state.choices, state.selectedId);
    if (!selectedChoice) {
      return;
    }
    if (selectedChoice.isCorrect) {
      if (state.hadWrongAttempt) {
        answerCard(1);
        return;
      }
      state.solvedOnFirstTry = true;
      renderMcq(state);
      return;
    }
    selectedChoice.isEliminated = true;
    state.selectedId = null;
    state.hadWrongAttempt = true;
    renderMcq(state);
  }
  function renderMcq(state) {
    renderChoices(state);
    renderActions(state);
  }
  function renderChoices(state) {
    var container = getRoot().getElementById("foggy-mcq-choices");
    container.replaceChildren();
    state.choices.forEach(function(choice, index2) {
      var button = document.createElement("button");
      var isSelected = state.selectedId === choice.id;
      var isSolvedCorrect = state.solvedOnFirstTry && choice.isCorrect;
      button.type = "button";
      button.className = "foggy-mcq-choice";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", isSelected ? "true" : "false");
      if (isSelected) {
        button.classList.add("is-selected");
      }
      if (choice.isEliminated) {
        button.classList.add("is-eliminated");
      }
      if (isSolvedCorrect) {
        button.classList.add("is-correct");
      }
      button.disabled = choice.isEliminated || state.solvedOnFirstTry || !state.hasValidAnswer;
      var text3 = document.createElement("span");
      text3.className = "foggy-mcq-choice-text";
      text3.textContent = choice.text;
      var indexBadge = document.createElement("span");
      indexBadge.className = "foggy-mcq-choice-index";
      indexBadge.textContent = String(index2 + 1);
      button.appendChild(text3);
      button.appendChild(indexBadge);
      button.addEventListener("click", function() {
        state.selectedId = choice.id;
        renderMcq(state);
      });
      container.appendChild(button);
    });
  }
  function renderActions(state) {
    var primaryButton = getRoot().getElementById("foggy-mcq-primary-btn");
    var ratingRow = getRoot().getElementById("foggy-mcq-rating-row");
    if (state.solvedOnFirstTry) {
      setHidden(primaryButton, true);
      setHidden(ratingRow, false);
      return;
    }
    setHidden(primaryButton, false);
    setHidden(ratingRow, true);
    primaryButton.textContent = state.hadWrongAttempt ? "Continue" : "Check";
    primaryButton.disabled = !state.hasValidAnswer || !state.selectedId;
  }
  function buildChoices(rawChoices) {
    var parsed = parseJsonChoices(rawChoices);
    return parsed;
  }
  function parseJsonChoices(rawChoices) {
    var json;
    try {
      json = JSON.parse(stripAnkiHtml(String(rawChoices || "")));
    } catch (_) {
      return { choices: [], valid: false };
    }
    if (!Array.isArray(json) || json.length === 0) {
      return { choices: [], valid: false };
    }
    var correctCount = json.filter(function(item) {
      return item.correct === true;
    }).length;
    if (correctCount !== 1) {
      return { choices: [], valid: false };
    }
    return {
      choices: json.map(function(item, index2) {
        return {
          id: "mcq-choice-" + index2,
          text: String(item.text || ""),
          isCorrect: item.correct === true,
          isEliminated: false
        };
      }),
      valid: true
    };
  }
  function stripAnkiHtml(raw) {
    var div = document.createElement("div");
    div.innerHTML = raw;
    return div.textContent.trim();
  }
  function shuffleChoices(choices) {
    var shuffled = choices.slice();
    for (var index2 = shuffled.length - 1; index2 > 0; index2 -= 1) {
      var swapIndex = Math.floor(Math.random() * (index2 + 1));
      var current = shuffled[index2];
      shuffled[index2] = shuffled[swapIndex];
      shuffled[swapIndex] = current;
    }
    return shuffled;
  }
  function findChoice(choices, id) {
    return choices.find(function(choice) {
      return choice.id === id;
    });
  }

  // web/src/testcases.js
  function parseTestCases(cardData) {
    var rawCases;
    var inputNames = parseInputNames(cardData.starterCode || "");
    try {
      rawCases = JSON.parse(cardData.testCases || "[]");
    } catch (error) {
      return [];
    }
    if (!Array.isArray(rawCases)) {
      return [];
    }
    return rawCases.map(function(testCase) {
      var rawInputs = Array.isArray(testCase.input) ? testCase.input : typeof testCase.input === "undefined" ? [] : [testCase.input];
      return {
        inputs: rawInputs.map(function(value, index2) {
          return {
            label: (inputNames[index2] || "arg" + index2) + " =",
            value: formatJsonValue(value)
          };
        }),
        expected: formatJsonValue(testCase.output)
      };
    });
  }
  function populateTestcases(cardData) {
    var container = getRoot().getElementById("foggy-testcase-content");
    var testCases = parseTestCases(cardData);
    container.replaceChildren();
    if (!testCases.length) {
      renderHint(container, "No test cases");
      return;
    }
    var showCaseTabs = testCases.length > 1;
    var caseTabs = showCaseTabs ? createCaseRail("Test cases") : null;
    var caseContents = [];
    testCases.forEach(function(testCase, index2) {
      var content3 = document.createElement("div");
      content3.className = "foggy-case-content";
      content3.setAttribute("role", "tabpanel");
      setHidden(content3, index2 !== 0);
      renderInputSection(content3, testCase.inputs);
      renderValueSection(content3, "Expected", testCase.expected);
      caseContents.push(content3);
      if (!caseTabs) {
        return;
      }
      var button = document.createElement("button");
      var isSelected = index2 === 0;
      button.className = "foggy-case-pill";
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", isSelected ? "true" : "false");
      button.textContent = "Case " + (index2 + 1);
      button.addEventListener("click", function() {
        caseTabs.querySelectorAll(".foggy-case-pill").forEach(function(pill) {
          pill.setAttribute("aria-selected", "false");
        });
        button.setAttribute("aria-selected", "true");
        caseContents.forEach(function(panel, panelIndex) {
          setHidden(panel, panelIndex !== index2);
        });
      });
      caseTabs.appendChild(button);
    });
    if (caseTabs) {
      container.appendChild(caseTabs);
    }
    caseContents.forEach(function(content3) {
      container.appendChild(content3);
    });
  }
  function parseInputNames(starterCode) {
    var signatureMatch = starterCode.match(/def\s+\w+\s*\(([^)]*)\)/m) || starterCode.match(/\w+\s*\(([^)]*)\)/m);
    if (!signatureMatch) {
      return [];
    }
    return signatureMatch[1].split(",").map(function(part) {
      var name = part.trim().replace(/^\*{1,2}/, "").replace(/^const\s+/, "").split("=")[0].trim().split(":")[0].trim().replace(/[&*\[\]]/g, "").trim().split(/\s+/).pop();
      if (!name || name === "self" || name === "cls" || name === "void") {
        return "";
      }
      return name;
    }).filter(Boolean);
  }
  function createCaseRail(label) {
    var rail = document.createElement("div");
    rail.className = "foggy-case-pill-rail";
    rail.setAttribute("role", "tablist");
    rail.setAttribute("aria-label", label);
    return rail;
  }

  // web/src/results.js
  var RATINGS = [
    { ease: 1, label: "Again", cls: "again" },
    { ease: 2, label: "Hard", cls: "hard" },
    { ease: 3, label: "Good", cls: "good" },
    { ease: 4, label: "Easy", cls: "easy" }
  ];
  function renderResults(result, cardData) {
    var container = getRoot().getElementById("foggy-results-content");
    var shell = document.createElement("div");
    shell.className = "foggy-result-shell";
    container.replaceChildren();
    if (result.error) {
      shell.appendChild(buildResultHeader(result, 0));
      var errorSection = createDetailSection("Details");
      errorSection.appendChild(createDetailField("", result.error, "foggy-case-value--error"));
      shell.appendChild(errorSection);
      container.appendChild(shell);
      return;
    }
    var resultCases = Array.isArray(result.results) ? result.results : [];
    if (!resultCases.length) {
      if (result.revealedWithoutPass) {
        shell.appendChild(buildSolutionRevealHeader(result, cardData));
        container.appendChild(shell);
        return;
      }
      renderHint(container, "Press Run to execute your code");
      return;
    }
    var testCases = parseTestCases(cardData);
    var selectedIndex = resultCases.findIndex(function(item) {
      return item.status !== "pass";
    });
    if (selectedIndex === -1) {
      selectedIndex = 0;
    }
    shell.appendChild(buildResultHeader(result, selectedIndex));
    var showCaseTabs = resultCases.length > 1;
    var caseTabs = showCaseTabs ? createResultRail() : null;
    var caseContents = [];
    resultCases.forEach(function(resultCase, index2) {
      var testcase = testCases[index2] || null;
      var content3 = createResultCaseContent(resultCase, testcase, showCaseTabs);
      content3.setAttribute("role", "tabpanel");
      setHidden(content3, index2 !== selectedIndex);
      caseContents.push(content3);
      if (!caseTabs) {
        return;
      }
      var pill = document.createElement("button");
      var isSelected = index2 === selectedIndex;
      var statusClass = getCaseStatusClass(resultCase.status);
      pill.className = "foggy-case-pill foggy-case-pill--result";
      pill.type = "button";
      pill.setAttribute("role", "tab");
      pill.setAttribute("aria-selected", isSelected ? "true" : "false");
      var statusIcon = document.createElement("span");
      statusIcon.className = "foggy-case-pill-status foggy-case-pill-status--" + statusClass;
      statusIcon.textContent = getCaseStatusSymbol(resultCase.status);
      statusIcon.setAttribute("aria-hidden", "true");
      var label = document.createElement("span");
      label.textContent = "Case " + (index2 + 1);
      pill.appendChild(statusIcon);
      pill.appendChild(label);
      pill.addEventListener("click", function() {
        caseTabs.querySelectorAll(".foggy-case-pill").forEach(function(tab) {
          tab.setAttribute("aria-selected", "false");
        });
        pill.setAttribute("aria-selected", "true");
        caseContents.forEach(function(panel, panelIndex) {
          setHidden(panel, panelIndex !== index2);
        });
      });
      caseTabs.appendChild(pill);
    });
    if (caseTabs) {
      shell.appendChild(caseTabs);
    }
    caseContents.forEach(function(content3) {
      shell.appendChild(content3);
    });
    container.appendChild(shell);
  }
  function setRatingButtonsVisible(visible) {
    var existing = getRoot().getElementById("foggy-rating-row");
    if (!visible) {
      if (existing) {
        existing.remove();
      }
      return;
    }
    if (existing) {
      return;
    }
    var row = document.createElement("div");
    row.id = "foggy-rating-row";
    row.className = "foggy-rating-row";
    RATINGS.forEach(function(rating) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "foggy-rating-btn foggy-rating-btn--" + rating.cls;
      btn.textContent = rating.label;
      btn.addEventListener("click", function() {
        answerCard(rating.ease);
      });
      row.appendChild(btn);
    });
    getRoot().getElementById("foggy-bottom-panel").appendChild(row);
  }
  function buildResultHeader(result, focusIndex) {
    var header = document.createElement("section");
    var tone = "fail";
    var detail = "Output did not match the expected result.";
    var results = Array.isArray(result.results) ? result.results : [];
    var focusResult = results[focusIndex] || null;
    if (result.error) {
      tone = "error";
      detail = result.error;
    } else if (result.passed === result.total && result.total > 0) {
      tone = "pass";
      detail = "All submitted testcases passed.";
    } else if (focusResult && focusResult.status === "error") {
      tone = "error";
      detail = "Case " + (focusIndex + 1) + " raised an exception.";
    } else if (focusResult) {
      detail = "Case " + (focusIndex + 1) + " produced a different output.";
    }
    header.className = "foggy-result-header foggy-result-header--" + tone;
    var meta = document.createElement("div");
    meta.className = "foggy-result-meta";
    var detailEl = document.createElement("div");
    detailEl.className = "foggy-result-detail";
    detailEl.textContent = detail;
    meta.appendChild(detailEl);
    var count = document.createElement("div");
    count.className = "foggy-result-count";
    count.textContent = result.passed + " / " + result.total + " " + (result.total === 1 ? "testcase" : "testcases") + " passed";
    header.appendChild(meta);
    header.appendChild(count);
    return header;
  }
  function buildSolutionRevealHeader(result, cardData) {
    var header = document.createElement("section");
    var total = result.total || parseTestCases(cardData).length;
    header.className = "foggy-result-header foggy-result-header--reveal";
    var meta = document.createElement("div");
    meta.className = "foggy-result-meta";
    var detailEl = document.createElement("div");
    detailEl.className = "foggy-result-detail";
    detailEl.textContent = "Reference solution opened before any full-pass submission.";
    meta.appendChild(detailEl);
    var count = document.createElement("div");
    count.className = "foggy-result-count";
    count.textContent = "0 / " + total + " " + (total === 1 ? "testcase" : "testcases") + " passed";
    header.appendChild(meta);
    header.appendChild(count);
    return header;
  }
  function getCaseStatusClass(status) {
    if (status === "pass") {
      return "pass";
    }
    if (status === "error") {
      return "error";
    }
    return "fail";
  }
  function getCaseStatusSymbol(status) {
    if (status === "pass") {
      return "\u2713";
    }
    if (status === "error") {
      return "!";
    }
    return "\xD7";
  }
  function createResultCaseContent(resultCase, testcase, showInput) {
    var content3 = document.createElement("div");
    content3.className = "foggy-case-content foggy-case-content--result";
    if (showInput && testcase) {
      renderInputSection(content3, testcase.inputs);
    }
    if (resultCase.status === "error") {
      renderValueSection(
        content3,
        "Error",
        resultCase.message || "Runtime error",
        "foggy-case-value--error"
      );
      return content3;
    }
    var outputText = "";
    var expectedText = "";
    if (resultCase.status === "pass") {
      outputText = testcase ? testcase.expected : "";
      expectedText = outputText;
    } else {
      outputText = formatSerializedResult(resultCase.got);
      expectedText = hasDisplayValue(resultCase.expected) ? formatSerializedResult(resultCase.expected) : testcase ? testcase.expected : "";
    }
    renderValueSection(
      content3,
      "Output",
      outputText,
      resultCase.status === "fail" ? "foggy-case-value--danger" : "foggy-case-value--success"
    );
    renderValueSection(content3, "Expected", expectedText);
    return content3;
  }
  function createResultRail() {
    var rail = document.createElement("div");
    rail.className = "foggy-case-pill-rail foggy-case-pill-rail--results";
    rail.setAttribute("role", "tablist");
    rail.setAttribute("aria-label", "Test results");
    return rail;
  }

  // web/src/tabs.js
  function initTabs(onSelect) {
    getRoot().querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function(tab) {
      tab.addEventListener("click", function() {
        onSelect(tab.getAttribute("data-tab") || "testcase");
      });
    });
  }
  function setActiveTab(target, state) {
    state.activeTab = target;
    getRoot().querySelectorAll(".foggy-panel-tab[data-tab]").forEach(function(tab) {
      var isActive = tab.getAttribute("data-tab") === target;
      tab.classList.toggle("active", isActive);
    });
    setHidden(getRoot().getElementById("foggy-tab-testcase"), target !== "testcase");
    setHidden(getRoot().getElementById("foggy-tab-result"), target !== "result");
  }

  // web/src/left-tabs.js
  function initLeftTabs(cardData, onSolutionAccess) {
    var tabs = getRoot().querySelectorAll("[data-left-tab]");
    var problemPanel = getRoot().getElementById("foggy-problem");
    var solutionPanel = getRoot().getElementById("foggy-solution");
    var solutionView = null;
    tabs.forEach(function(tab) {
      tab.addEventListener("click", function() {
        var target = tab.getAttribute("data-left-tab");
        if (target === "solution" && cardData.solution && !solutionView) {
          solutionView = renderSolution(cardData.solution, cardData.language);
        }
        if (target === "solution" && typeof onSolutionAccess === "function") {
          onSolutionAccess();
        }
        tabs.forEach(function(t) {
          t.classList.toggle("active", t === tab);
        });
        setHidden(problemPanel, target !== "description");
        setHidden(solutionPanel, target !== "solution");
      });
    });
  }
  function renderSolution(code, lang) {
    var container = getRoot().getElementById("foggy-solution-code");
    container.replaceChildren();
    return createCodeMirror(container, code, {
      language: lang,
      readOnly: true,
      showGutters: false
    });
  }

  // web/src/index.js
  function init() {
    var dataEl = document.getElementById("foggy-data");
    if (!dataEl) {
      return;
    }
    var cardData = JSON.parse(dataEl.textContent);
    var host = document.getElementById("foggy-host");
    if (!host) {
      return;
    }
    prepareHost(host);
    var shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    var foggyStyle = document.getElementById("foggy-style");
    var foggyTemplate = document.getElementById("foggy-template");
    if (foggyStyle) {
      shadow.innerHTML = "<style>" + foggyStyle.textContent + "</style>" + foggyTemplate.innerHTML;
    }
    setRoot(shadow);
    var state = {
      activeTab: "testcase",
      cardData,
      codeStorageKey: cardData.cardId ? "foggy:code:" + cardData.cardId : null,
      editorView: null,
      hasPassedTests: false,
      lastResult: null,
      solutionRevealedBeforePass: false
    };
    initIcons();
    initHeader(cardData);
    initHomeButton();
    if (cardData.kind === "mcq") {
      initMcqCard(cardData);
      return;
    }
    getRoot().getElementById("foggy-title").textContent = cardData.title;
    renderDescription(cardData.description);
    state.editorView = initEditor(cardData, state.codeStorageKey);
    initActionButtons(function() {
      runCode(state);
    });
    initTabs(function(target) {
      setActiveTab(target, state);
    });
    initSplitGrid();
    initLeftTabs(cardData, function() {
      handleSolutionAccess(state);
    });
    setActiveTab(state.activeTab, state);
    populateTestcases(cardData);
    registerResultHandler(function(result) {
      setRunningState(false);
      state.lastResult = result;
      renderResults(result, state.cardData);
      if (result.error === null && result.passed === result.total && result.total > 0) {
        state.hasPassedTests = true;
        state.solutionRevealedBeforePass = false;
      }
      setRatingButtonsVisible(state.hasPassedTests || state.solutionRevealedBeforePass);
    });
  }
  function prepareHost(host) {
    host.style.display = "block";
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.margin = "0";
    host.style.padding = "0";
    host.style.border = "0";
    host.style.overflow = "hidden";
  }
  function initHomeButton() {
    var homeButton = getRoot().getElementById("foggy-home-btn");
    if (homeButton) {
      homeButton.addEventListener("click", navigateHome);
    }
  }
  function initActionButtons(onRun) {
    var runButton = getRoot().getElementById("foggy-run-btn");
    var checkButton = getRoot().getElementById("foggy-check-btn");
    if (runButton) {
      runButton.addEventListener("click", onRun);
    }
    if (checkButton) {
      checkButton.addEventListener("click", onRun);
    }
  }
  function runCode(state) {
    if (!state.editorView || !state.cardData) {
      return;
    }
    setRunningState(true);
    setActiveTab("result", state);
    sendRunRequest({
      code: state.editorView.state.doc.toString(),
      functionName: state.cardData.functionName,
      testCases: state.cardData.testCases,
      language: state.cardData.language || "Python"
    });
  }
  function handleSolutionAccess(state) {
    if (state.hasPassedTests) {
      return;
    }
    state.solutionRevealedBeforePass = true;
    setActiveTab("result", state);
    renderResults(buildSolutionRevealResult(state), state.cardData);
    setRatingButtonsVisible(true);
  }
  function buildSolutionRevealResult(state) {
    if (state.lastResult) {
      return Object.assign({}, state.lastResult, {
        revealedWithoutPass: true
      });
    }
    return {
      results: [],
      passed: 0,
      total: 0,
      error: null,
      revealedWithoutPass: true
    };
  }
  function setRunningState(running) {
    var runButton = getRoot().getElementById("foggy-run-btn");
    var checkButton = getRoot().getElementById("foggy-check-btn");
    if (runButton) {
      runButton.textContent = running ? "Running..." : "Run";
      runButton.classList.toggle("running", running);
    }
    if (!checkButton) {
      return;
    }
    checkButton.classList.toggle("running", running);
    var iconSpan = checkButton.querySelector(".foggy-check-icon");
    if (iconSpan) {
      iconSpan.style.display = running ? "none" : "";
    }
    var textNode = Array.prototype.find.call(checkButton.childNodes, function(node2) {
      return node2.nodeType === Node.TEXT_NODE && node2.textContent.trim().length > 0;
    });
    if (textNode) {
      textNode.textContent = running ? " Checking..." : "Check";
      return;
    }
    checkButton.appendChild(document.createTextNode(running ? " Checking..." : "Check"));
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
