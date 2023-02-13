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

const Tabs = {};

const sender = [];

const send = msg => sender[0] && chrome.tabs.sendMessage(sender[0], msg);

const _pc = _PC.create((Map => async (e, _pc) => {
    const _Map = {};
    const f = _Map[e.type] || Map[e.type];
    await f && f(e, _pc);
    _PC.isClosed(_pc) && console.log('11');
})(_PC.simpleCb(send)));

(Map => chrome.runtime.onMessage.addListener(async (request, b) => {
    const msg = request || {};
    const _Map = {
        login() {
            Tabs[b.tab.id] = 1;
        }
    };
    const f = _Map[msg.type] || Map[msg.type];
    await f && f(msg);
}))(_PC.simpleOnCb(_pc, send));

chrome.commands.onCommand.addListener((_, b) => {
    if(!Tabs[b.id]) {
        return
    }
    sender[0] = b.id;
    chrome.tabCapture.capture({
        video: true,
        videoConstraints: {
            mandatory: {
                minWidth: b.width * window.devicePixelRatio,
                minHeight: b.height * window.devicePixelRatio,
                maxWidth: b.width * window.devicePixelRatio,
                maxHeight: b.height * window.devicePixelRatio
            }
        }
    }, stream => _PC.addStream(_pc, stream));
});
