(() => {
    const JUGG = document.getElementById('JUGG');
    if(!JUGG) {
        return
    }
    JUGG.setAttribute('JUGG', '123');

    /*----------*/
    const _PC = function() {
        const offer = async function(_pc) {
            const offer = await _pc.createOffer();
            _pc.signalingState === 'stable' && await _pc.setLocalDescription(offer);
        };
        const answer = async function(_pc, offer) {
            const xs = _pc.signalingState === 'stable' ? [
                _pc.setRemoteDescription(offer)
            ] : [
                _pc.setLocalDescription({type: "rollback"}),
                _pc.setRemoteDescription(offer)
            ];
            await Promise.all(xs);
            await _pc.setLocalDescription(await _pc.createAnswer());
        };
        const addStream = function(_pc, webcamStream) {
            webcamStream.getTracks().forEach( track => _pc.addTransceiver(track, {streams: [webcamStream]}));
        };
        const isClosed = function(_pc) {
            return ['closed', 'failed', 'disconnected'].indexOf(_pc.iceConnectionState) !== -1 || ['closed'].indexOf(_pc.signalingState) !== -1;
        };
        const simpleOnCb = function(_pc, send) {
            return {
                async offer(msg) {
                    await _PC.answer(_pc, msg.offer)
                    send({
                        type: 'answer',
                        answer: JSON.parse(JSON.stringify(_pc.localDescription))
                    });
                },
                answer(msg) {
                    _pc.setRemoteDescription(msg.answer);
                },
                icecandidate(msg) {
                    _pc.addIceCandidate(msg.candidate);
                }
            };
        };
        const simpleCb = function(send) {
            return {
                icecandidate(e, _pc) {
                    e.candidate && send({
                        type: 'icecandidate',
                        candidate: JSON.parse(JSON.stringify(e.candidate))
                    });
                },
                async negotiationneeded(e, _pc) {
                    await _PC.offer(_pc);
                    send({
                        type: 'offer',
                        offer: JSON.parse(JSON.stringify(_pc.localDescription))
                    });
                }
            };
        };
        const create = function(onchange) {
            const _pc = new RTCPeerConnection();
            const _onchange = e => (onchange(e, _pc));
            _pc.onicecandidate = _onchange
            _pc.oniceconnectionstatechange = _onchange;
            _pc.onicegatheringstatechange = _onchange;
            _pc.onsignalingstatechange = _onchange;
            _pc.onnegotiationneeded = _onchange;
            _pc.ontrack = _onchange;
            _pc.ondatachannel = _onchange;
            return _pc;
        };
        return {
            offer,
            answer,
            create,
            addStream,
            isClosed,
            simpleOnCb,
            simpleCb 
        };
    }();
    /*----------*/

    const temp = document.createElement('script');
    temp.setAttribute('type', 'text/javascript');
    temp.src = chrome.extension.getURL('inject.js');
    temp.onload = function() {
        this.parentNode.removeChild(this);
    };
    document.head.appendChild(temp);

    const send = chrome.runtime.sendMessage;

    const _pc = _PC.create((Map => async (e, _pc) => {
        const _Map = {
            track(e) {
                console.log(e, 99);
                JUGG.srcObject = e.streams[0];
            }
        };
        const f = _Map[e.type] || Map[e.type];
        await f && f(e, _pc);
        _PC.isClosed(_pc) && console.log('11');
    })(_PC.simpleCb(send)));

    (Map => chrome.runtime.onMessage.addListener(async (request) => {
        const msg = request || {};
        const _Map = {};
        const f = _Map[msg.type] || Map[msg.type];
        await f && f(msg);
    }))(_PC.simpleOnCb(_pc, send));
    send({ type:'login' });
})()
