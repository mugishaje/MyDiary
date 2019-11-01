import Joi from 'joi';
import entriesModel from '../Models/entriesModel';
import userModel from '../Models/userModel';
import tokens from '../helpers/tokens';
import { schema } from '../middlewares/validation';
import response from '../helpers/Returns';
import displayMessage from '../helpers/displayMessages';
import statusCode from '../helpers/statusMessages';

const entryController = {
	createEntry(req, res) {
		const user = userModel.find((user) => user.email === tokens.decoded(req, res).email);
    const { title, description } = req.body;
    
		if (!user) { return res.status(401).json({ status: 401, message: 'You are not authorised for this operation. Sign in first.' }); }
		const result = Joi.validate({ title, description }, schema.entries);
		if (result.error) {
			return response.Validation(res, statusCode.BadRequest, result);
		}
		const date = new Date();

		// if the user exists
		const newEntry = {
			user_email: user.email,
			id: entriesModel.length + 1,
			createdOn: `${date.getHours()}:${date.getMinutes()}, ${date.toDateString()}`,
			title: req.body.title,
			description: req.body.description,
		};

		entriesModel.push(newEntry);
		const entryDisp = { ...newEntry };
		delete entryDisp.user_email;
		return res.status(201).json({ status: 201, message: 'success', data: entryDisp });
	},
	viewEntries(req, res) {
		const user = userModel.find(user => user.email == tokens.decoded(req, res).email);
		const entryFound = entriesModel.filter(entry => entry.user_email == tokens.decoded(req, res).email);

		if (user) {

			//view entries sorted in descending
			return entryFound.length !== 0 ?
				res.status(200).json({
					status: 200, message: "success", data: entryFound.sort((a, b) => b.id - a.id
					)
				}) : res.status(404).json({ status: 404, error: "You have not yet created an entry" })
		}
		return res.status(401).json({ status: 401, message: 'You are not authorised for this operation. Sign in first.' });
	},
	viewSpecificEntry(req, res) {
		const user = userModel.find((user) => user.email === tokens.decoded(req, res).email);
		const id = req.params.entry_id;

		const result = Joi.validate({ id }, schema.entryId);
		if (result.error) {
			return response.Validation(res, statusCode.BadRequest, result);
		}
		const entry = entriesModel.find((entry) => entry.id === parseInt(id, 10));
		if (user) {
			if (!entry) { return res.status(404).json({ status: 404, message: 'the entry was not found' }); }
			const entryFound = user.email === entry.user_email;
			return entryFound ? res.status(200).json({
				status: 200,
				message: 'success',
				data: entry
			}) : res.status(401).json({
				status: 401,
				error: 'You are unauthorised to access this entry'
			});
		}
		return res.status(401).json({ status: 401, message: 'You are not authorised for this operation. Sign in first.' });
	},
	modifyEntry(req, res) {
		const user = userModel.find((user) => user.email === tokens.decoded(req, res).email);
		const id = req.params.entry_id;
		const { title } = req.body;
		const { description } = req.body;

		const entry = entriesModel.find((entry) => entry.id === parseInt(id, 10));
		if (user) {
			// validate the user input
			const result = Joi.validate({ id, title, description }, schema.entries);
			if (result.error) {
				return response.Validation(res, statusCode.BadRequest, result);
			}

			if (!entry) { return res.status(404).json({ status: 404, error: 'the  entry was not found' }); }

			if (entry.user_email === user.email) {
				const date = new Date();
				entriesModel.find((entry) => entry.id === parseInt(id, 10)).description = description;
				entriesModel.find((entry) => entry.id === parseInt(id, 10)).title = title;
				entriesModel.find((entry) => entry.id === parseInt(id, 10)).createdOn = `${date.getHours()}:${date.getMinutes()}, ${date.toDateString()}`;
				return res.status(200).json({ status: 200, message: 'entry successfully edited', data: { title, description } });
			}

			return res.status(401).json({ status: 401, error: "you can not edit another user's entry" });
		}

		return res.status(401).json({ status: 401, error: 'You are not authorised for this operation. Sign in first.' });
	},
	deleteEntry(req, res) {
		const user = userModel.find((user) => user.email === tokens.decoded(req, res).email);
		const id = req.params.entry_id;

		const result = Joi.validate({ id }, schema.entryId);
		if (result.error) {
			return response.Validation(res, statusCode.BadRequest, result);
		}
		if (user) {
			const entry = entriesModel.find((entry) => entry.id === parseInt(id, 10));
			if (!entry) { return res.status(404).json({ status: 404, message: 'the entry was not found' }); }

			// if the entry exists check if it's id matches those the user has made
			if (entry.user_email === user.email) {
				const entry_index = entriesModel.indexOf(entry);
				entriesModel.splice(entry_index, 1);
				return res.status(200).json({
					status: 200,
					message: 'entry successfully deleted',
				});
			}
			return res.status(401).json({ status: 401, error: "you can not delete another user's entries" });
		}
		return res.status(401).json({ status: 401, error: 'You are not authorised for this operation. Sign in first.' });
	},
}

export default entryController;
