#!

const prompt = require('prompt');
const {promisify} = require('util');
const bcrypt = require('bcryptjs');
const {eventualDb, closeDb} = require('../db-conn.js');

const promptGet = promisify(prompt.get);
const bcryptHash = promisify(bcrypt.hash);

const promptSchema = {
    properties: {
        name:           {
            required:    true,
            description: 'Full name',
        },
        email:          {
            required:    true,
            description: 'Email',
        },
        password:       {
            required: true,
            hidden:   true,
            replace:  '*',
        },
        password_check: {
            required: true,
            hidden:   true,
            replace:  '*',
        },
        roles:          {
            default:     'Admin',
            description: 'User Roles(comma separated)',
            before:      roles => roles.split(',').map(s => s.trim())
        }
    }
};

prompt.message = null;

replaceExistingSchema = {
    properties: {
        update: {
            description: 'Existing User Found, Update?',
            default:     'no',
            pattern:     /^(y|n|yes|no)$/i,
            before:      s => /^(y|yes)$/i.test(s)
        }
    }
};

//
// Start the prompt
//
prompt.start();

(async () => {
    const {name, email, password, password_check, roles} = await promptGet(promptSchema);

    if(password !== password_check)
    {
        console.log('Passwords must match');
        return;
    }

    const hash = await bcryptHash(password, 14);

    const db = await eventualDb;
    const user = await db.collection('users').findOne({email: email.toLowerCase()});

    let result;

    if(user !== null)
    {
        const {update} = await promptGet(replaceExistingSchema);
        if(!update)
        {
            console.log('Operation cancelled');
            return closeDb();
        }

        result = (await db.collection('users').updateOne(
            {_id: user._id},
            {
                $set:   {
                    name,
                    email: email.toLowerCase(),
                    password: hash,
                    roles
                },
                $unset: {
                    access_key: 1
                }
            }
        )).result
    }
    else
    {
        result = (await db.collection('users').insertOne({
            name,
            email: email.toLowerCase(),
            password: hash,
            roles
        })).result;
    }

    console.log('Success', result);
    return closeDb()
})();
