
export function muse() {
    const createPlayer = src => {
        const audio = document.createElement("audio")
        audio.src = src
        audio.setAttribute('controls','true')
        return audio
    }

    const createDownloadLink = (chunks, title = `Algo Music`) => {
        const anchor = <HTMLAnchorElement>document.createElement('anchor')
        anchor.href = URL.createObjectURL(new Blob(chunks))
        anchor.download = `${title}.wav`
        anchor.innerText = `Download Track ${title}`
        return anchor
    }

    console.log('attempting download for 1 second duet')
    const ctx = new AudioContext()

    const mixer = ctx.createMediaStreamDestination()
    // @ts-ignore
    const recorder = new window.MediaRecorder(mixer.stream)
    // const samples = ctx.createBuffer(parts.length, ctx.sampleRate * 9, audioCtx.sampleRate)
    const samples = []


    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 2* 220;
    osc1.connect(ctx.destination);
    osc1.connect(mixer);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 4* 261.6255653005986;
    osc2.connect(ctx.destination);
    osc2.connect(mixer);

    osc1.start();
    osc2.start();
    recorder.start();

    recorder.ondataavailable = e => {
        samples.push(e.data)
    }

    recorder.onstart = (e) =>
      console.log('started the recording')


    recorder.onerror = (err) => 
      (console.log('error with recorder'),console.error(err))


    recorder.onstop = (e) => {
        let blob = new Blob(
            samples, { 'type' : 'audio/ogg; codecs=opus' }
        );

        let title = 'magi'
        let url = URL.createObjectURL(blob);

        const audio = createPlayer(url)
        const anchor = createDownloadLink(samples, title)
        document.body.appendChild(anchor)
        document.body.appendChild(audio)
        console.log('click here')
        console.log(anchor)
        // anchor.onclick = () => anchor.remove()
      }

    setTimeout(() => {
        osc1.stop()
        osc2.stop()
        recorder.stop()
    }, 1000);
}
1