import { useCallback, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { askForAgent } from './agent'

function App() {

  const [input, setInput] = useState('')
  const [awsanswer, setAwsnwer] = useState('')

  const buttonAction = useCallback(() => {
    askForAgent(input)
    .then((answer) => {
      setAwsnwer(answer)
      setInput('')
    }).catch((err) => {
      console.error(err);
      setAwsnwer('Ops, something went wrong')
    })
  }, [input])

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <input
          type="text"
          placeholder="ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="button"
          className="counter"
          onClick={buttonAction}
        >
          Ask
        </button>
        <p>{awsanswer}</p>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
