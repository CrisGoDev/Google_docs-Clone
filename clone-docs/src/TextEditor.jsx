import React from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useCallback, useEffect, useState } from 'react';


function TextEditor() {
    const { id: documentId } = useParams();
    const [socket, setsocket] = useState()
    const [quill, setquill] = useState()

    const SAVE_INTERVAL=2000;


    // Conexion
    useEffect(() => {
        const s = io('http://localhost:3001')
        setsocket(s)
        return () => {
            s.disconnect();
        };
    }, [])

    // No se que hace, probando
    useEffect(() => {
        if (socket === null || quill === null || quill === undefined) return;

        const interval= setInterval(()=>{
            socket.emit('save-document', quill.getContents());
        },  SAVE_INTERVAL)


        return ()=>{
         clearInterval(interval);   
        }


    }, [socket, quill])




    // Enviar Cambios de el documento
    useEffect(() => {

        if (socket === null || quill === null || quill === undefined) return;
        const handler = (delta, oldDelta, source) => {
            if (source !== "user") return
            socket.emit("send-changes", delta)
        }
        quill.on("text-change", handler);

        return () => {
            quill.off("text-change", handler)
        }
    }, [socket, quill])

    // Aca es donde reciben cambios

    useEffect(() => {

        if (socket === null || quill === null || socket === undefined) return;

        const handler = delta => {
            console.log(delta)
            quill.updateContents(delta);
        }
        socket.on("receive-changes", handler);


        return () => {
            socket.off("receive-changes", handler)
        }
    }, [socket, quill])


    // Aca Estará cargando el documento

    useEffect(() => {

        if (socket === null || quill === null || socket === undefined) return;

        socket.once("load-document", document => {
            quill.setContents(document);
            quill.enable();
        })

        socket.emit('get-document', documentId);
    }, [socket, quill, documentId])




    const TOOLBAR_OPTIONS = [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        [{ script: "sub" }, { script: "super" }],
        [{ align: [] }],
        ["image", "blockquote", "code-block"],
        ["clean"],
    ]


    const wrapperRef = useCallback(
        wrapper => {
            if (wrapper === null) return;
            wrapper.innerHtml = "";
            const editor = document.createElement("div");
            wrapper.append(editor);
            const q = new Quill(editor, { theme: 'snow', modules: { toolbar: TOOLBAR_OPTIONS } })
            setquill(q);
            q.disable();
            q.setText('Loading...')
        },
        [],
    )


    return <div className='container' ref={wrapperRef} ></div>
}

export default TextEditor