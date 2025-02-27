import express from "express";
import multer from "multer"
import { PrismaClient } from '@prisma/client'
import cors from 'cors'

const prisma = new PrismaClient()
const app = express()
app.use(express.json())
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.static('public'))
const port = process.env.PORT || 3000
const storage = multer.diskStorage( {
    destination: function (req, file, cb) {
        cb(null, './public/imgs')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})
const upload = multer({ storage: storage, fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(null, false)
    }
    cb(null, true)
} })

app.get('/', (req, res) => {
    res.status(200).send(`API de Omniscient Reader's Viewpoint`)
})

app.get('/characters', async (req, res) => {
    let characters = await prisma.character.findMany()
    res.status(200).json(characters)
})
app.post('/characters', upload.fields([
    { name: 'img1', maxCount: 1},
    { name: 'img2', maxCount: 1},
    ]), async (req, res) => {
        let baseurl = `https://${req.get('host')}`
        let img1url = req.files['img1'] ? `${baseurl}/imgs/${req.files['img1'][0].filename}`: null
        let img2url = req.files['img2'] ? `${baseurl}/imgs/${req.files['img2'][0].filename}`: null

        await prisma.character.create({
            data: {
                name:          req.body.name,
                race:          req.body.race,
                constellation: req.body.constellation,
                description:   req.body.description,
                img1:          img1url,
                img2:          img2url
            }
        })
        res.status(201).json({
            ...req.body,
            img1: img1url,
            img2: img2url
        })
})

app.delete('/characters/:id', async (req, res) => {
    await prisma.character.delete({
        where: { id: req.params.id }
    })
})

app.listen(port)