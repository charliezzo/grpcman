import './App.css'
import { useEffect, useState } from 'react'

const protoLoader = require('@grpc/proto-loader')
const grpc = require('@grpc/grpc-js')

function App() {
    const [serverAddress, setServerAddress] = useState('grpcmantest.d8s.fun:50051')

    const [protoFilePath, setProtoFilePath] = useState<string>('')

    const [protoPackageDefinition, setProtoPackageDefinition] = useState<any>()
    useEffect(() => {
        console.log('protoFilePath', protoFilePath)
        // 空文件路径直接返回
        if (protoFilePath === '') {
            return
        }

        // 文件类型错误直接返回
        if (protoFilePath.split('.').pop() !== 'proto') {
            setRequestErrorStr(requestErrorStr === '' ? '文件类型错误，请选择 proto 文件' : requestErrorStr + '\n' + '文件类型错误，请选择 proto 文件')
            return
        }

        // 解析 proto 文件错误直接返回
        try {
            const protoPackageDefinition = protoLoader.loadSync(protoFilePath)
            console.log('protoPackageDefinition', protoPackageDefinition)
            setProtoPackageDefinition(protoPackageDefinition)
        } catch (err: any) {
            setRequestErrorStr(requestErrorStr === '' ? '文件解析错误，请检查 proto 文件' : requestErrorStr + '\n' + '文件解析错误，请检查 proto 文件')
            return
        }
    }, [protoFilePath])

    const [grpcObject, setGrpcObject] = useState<any>()
    useEffect(() => {
        // grpc 加载错误直接返回
        try {
            const grpcObject = grpc.loadPackageDefinition(protoPackageDefinition)
            console.log('grpcObject', grpcObject)
            setGrpcObject(grpcObject)
        } catch (err: any) {
            setRequestErrorStr(requestErrorStr === '' ? 'grpc 加载错误，请检查 proto 文件' : requestErrorStr + '\n' + 'grpc 加载错误，请检查 proto 文件')
            return
        }
    }, [protoPackageDefinition])

    const [protoServiceDefinitionKeyList, setProtoServiceDefinitionKeyList] = useState<string[]>([])
    useEffect(() => {
        if (!protoPackageDefinition) {
            return
        }
        const protoServiceDefinitionKeyList = Object.keys(protoPackageDefinition)
        console.log('protoServiceDefinitionKeyList', protoServiceDefinitionKeyList)
        setProtoServiceDefinitionKeyList(protoServiceDefinitionKeyList)
    }, [protoPackageDefinition])

    const [currentProtoServiceDefinitionKey, setCurrentProtoServiceDefinitionKey] = useState<string>('')
    useEffect(() => {
        if (protoServiceDefinitionKeyList) {
            setCurrentProtoServiceDefinitionKey(protoServiceDefinitionKeyList[0])
        }
    }, [protoServiceDefinitionKeyList])

    const [protoMethodDefinitionKeyList, setProtoMethodDefinitionKeyList] = useState<string[]>([])
    useEffect(() => {
        if (!currentProtoServiceDefinitionKey) {
            return
        }
        const protoMethodDefinitionKeys = Object.keys(protoPackageDefinition[currentProtoServiceDefinitionKey])
        console.log('protoMethodDefinitionKeyList', protoMethodDefinitionKeys)
        setProtoMethodDefinitionKeyList(protoMethodDefinitionKeys)
    }, [currentProtoServiceDefinitionKey])

    const [currentProtoMethodDefinitionKey, setCurrentProtoMethodDefinitionKey] = useState<string>('')
    useEffect(() => {
        if (protoMethodDefinitionKeyList) {
            setCurrentProtoMethodDefinitionKey(protoMethodDefinitionKeyList[0])
        }
    }, [protoMethodDefinitionKeyList])

    const [requestDataStr, setRequestDataStr] = useState<string>('{"name": "grpcman"}')

    const [responseDataStr, setResponseDataStr] = useState<string>('')

    const [requestErrorStr, setRequestErrorStr] = useState<string>('')

    const handleSendButtonClick = () => {
        console.log('grpcObject', grpcObject)
        console.log('currentProtoServiceDefinitionKey', currentProtoServiceDefinitionKey)

        const packageName = currentProtoServiceDefinitionKey.split('.')[0]
        console.log('packageName', packageName)

        const serviceName = currentProtoServiceDefinitionKey.split('.')[1]
        console.log('serviceName', serviceName)

        const client = new grpcObject[packageName][serviceName](serverAddress, grpc.credentials.createInsecure())
        console.log('client', client)

        const requestDataJson = JSON.parse(requestDataStr)
        console.log('requestDataJson', requestDataJson)

        client[currentProtoMethodDefinitionKey](requestDataJson, (err: any, response: any) => {
            console.log('err', err)
            if (err) {
                setRequestErrorStr(requestErrorStr === '' ? JSON.stringify(err.stack) : requestErrorStr + '\n' + JSON.stringify(err.stack))
            }
            console.log('response', response)
            if (response) {
                setResponseDataStr(responseDataStr === '' ? JSON.stringify(response) : responseDataStr + '\n' + JSON.stringify(response))
            }
        })
    }

    return (
        <div>

            <fieldset>
                <legend>Server Address</legend>
                <input
                    type="text"
                    value={ serverAddress }
                    onChange={ e => setServerAddress(e.target.value) }
                />
            </fieldset>

            <fieldset>
                <legend>Select Proto File</legend>
                <input
                    type="file"
                    onChange={ e => {
                        if (e.target.files) {
                            const f = e.target.files[0]
                            // @ts-ignore
                            const fp = f['path']
                            console.log('fp', fp)
                            if (fp) {
                                setProtoFilePath(fp)
                            }
                        }
                    } }
                />
            </fieldset>

            <fieldset>
                <legend>Service Definition</legend>
                <select
                    value={ currentProtoServiceDefinitionKey }
                    onChange={ e => setCurrentProtoServiceDefinitionKey(e.target.value) }
                >
                    { protoServiceDefinitionKeyList.map(k => (
                        <option key={ k } value={ k }>{ k }</option>
                    )) }
                </select>
            </fieldset>

            <fieldset>
                <legend>Method Definition</legend>
                <select
                    value={ currentProtoMethodDefinitionKey }
                    onChange={ e => setCurrentProtoMethodDefinitionKey(e.target.value) }
                >
                    { protoMethodDefinitionKeyList.map(k => (
                        <option key={ k } value={ k }>{ k }</option>
                    )) }
                </select>
            </fieldset>

            <fieldset>
                <legend>Request Data</legend>
                <textarea
                    value={ requestDataStr }
                    onChange={ e => setRequestDataStr(e.target.value) }
                />
            </fieldset>

            <button disabled={ !currentProtoMethodDefinitionKey } onClick={ handleSendButtonClick }>Send</button>

            <fieldset>
                <legend>Response Data</legend>
                <textarea
                    value={ responseDataStr }
                    onChange={ e => setResponseDataStr(e.target.value) }
                />
            </fieldset>

            <fieldset>
                <legend>Request Error</legend>
                <textarea
                    value={ requestErrorStr }
                    onChange={ e => setRequestErrorStr(e.target.value) }
                />
            </fieldset>

        </div>
    )
}

export default App
