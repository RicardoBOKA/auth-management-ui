import React, { useState } from 'react';
import { Grid, Button, TextField, Autocomplete } from '@mui/material';
// import axios from 'axios';
import DialogContent from '@mui/material/DialogContent';

export default function RestrictionForm({ onClose, onAddRestriction }) {
  const [target_name, setTarget_Name] = useState(['']);
  const [target_id, setTarget_Id] = useState(['']);
  const [data, setData] = useState(['']);
  const [name, setName] = useState('');

  // const [optionsNameRestriction, setOptionsNameRestriction] = useState(['']);

  // const fetchTargetID = async () => {
  //   try {
  //     const response = await axios.get('http://localhost:8085/v1/restrictions/', {
  //       headers: { Accept: 'application/json' }
  //     });

  //     setNewData(response.data);
  //   } catch (error) {
  //     console.error('Erreur lors de la requête GET :', error);
  //   }
  // };

  const handleAutocompleteChange = (event, newValue) => {
    console.log('---');
    console.log(newValue.name);
    setName(newValue.name);
  };
  // const handleNewData = async () => {
  //   try {
  //     const response = await axios.get('http://localhost:8085/v1/restrictions/', {
  //       headers: { Accept: 'application/json' }
  //     });
  //     setNewData(response.data);
  //   } catch (error) {
  //     console.error('Erreur lors de la requête GET :', error);
  //   }
  // };
  // const handleClose = () => {
  //   handleNewData();
  //   close(false);
  // };

  const handleClose = () => {
    onClose();
  };

  const options = [
    { name: 'Counter Restriction', type: 'integer' },
    { name: 'Mount Restriction', type: 'float' },
    { name: 'Duration Restriction', type: 'time' },
    { name: 'Start Time Restriction', type: 'time' },
    { name: 'End Time Restriction', type: 'time' },
    { name: 'Start Date Restriction', type: 'datetime' },
    { name: 'End Date Restriction', type: 'datetime' },
    { name: 'Location Restriction', type: 'string' },
    { name: 'Role Restriction', type: 'string' },
    { name: 'State Restriction', type: 'string' }
  ];

  function getDataTypeForRestriction() {
    const selectedOption = options.find((option) => option.name === name);
    const dataType = selectedOption ? selectedOption.type : 'string';
    return dataType;
  }

  const handleSave = async () => {
    const dataType = getDataTypeForRestriction();
    const dataPayload = {
      type: dataType,
      value: data
    };
    try {
      await onAddRestriction(name, target_name, target_id, dataPayload);
      handleClose();
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
    }
  };

  // const handleSave = async () => {
  //   console.log('---');
  //   console.log(typeof name);
  //   console.log(name);

  //   const dataType = getDataTypeForRestriction();
  //   const dataPayload = {
  //     type: dataType,
  //     value: data
  //   };

  //   try {
  //     await axios.post(
  //       `http://localhost:8085/v1/restrictions/?target_name=${target_name}&target_id=${target_id}`,
  //       {
  //         name: name,
  //         data: JSON.stringify(dataPayload)
  //       },
  //       {
  //         headers: {
  //           Accept: '*/*',
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );
  //     handleClose();
  //   } catch (error) {
  //     console.error("Une erreur s'est produite :", error);
  //   }
  // };

  //DATA POUR LES AUTOCOMPLETION DE CHAQUE PAERTIE DE POST DATA.
  //1
  //Faire un fetch pour les options, dans la table de la base de données associée (restrictionType):
  // Surement avec : const [optionsNameRestriction, setOptionsNameRestriction] = useState(...);
  // const optionsNameRestriction =  axios.get.....;

  //2
  // Les Target, les table de la base de données que l'on cible () :
  // Surement un : const [targetOptions, setTargetOptions] = useState();
  // Puis un fetch de la base de données si on crée une table propre aux target possibles (les elements en dessus) :
  //
  // ou
  //
  // const targetOptions = [
  //   { target: 'Policy' },
  //   { target: 'Agent' },
  //   { target: 'ServicePath' }
  // ];

  // 3
  // Les différents ID présents dnas la base, qui sont chérchées dans la table associée (valeur courante de targetOptions selectionnée)
  // axios.get ....
  // Surement avec : targetIdOptions =  axios.get.....;

  return (
    <div>
      <DialogContent>
        <Grid>
          <h2>Post a Restriction</h2>
          <Autocomplete
            disablePortal
            id="restrction-name"
            options={options}
            sx={{ marginBottom: 2, width: '100%' }}
            getOptionLabel={(option) => (option.name ? option.name : name)}
            getOptionSelected={(option, value) => option.name === value.name}
            renderInput={(params) => <TextField {...params} label="Restriction" />}
            onChange={handleAutocompleteChange}
            value={options.find((option) => option.name === name) || 'Non defini'}
          />
        </Grid>
        <Grid>
          <TextField
            type="text"
            id="target table"
            label="Target"
            variant="outlined"
            value={target_name}
            onChange={(e) => setTarget_Name(e.target.value)}
            sx={{ marginBottom: 2, width: '50%' }}
          />
        </Grid>
        <Grid>
          <TextField
            type="text"
            id="target id"
            label="Target ID"
            variant="outlined"
            value={target_id}
            onChange={(e) => setTarget_Id(e.target.value)}
            sx={{ marginBottom: 2, width: '50%' }}
          />
        </Grid>
        <Grid>
          <TextField
            type="text"
            id="data"
            label="Data"
            variant="outlined"
            value={data}
            onChange={(e) => setData(e.target.value)}
            sx={{ marginBottom: 2, width: '50%' }}
          />
        </Grid>
        <Grid>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Post
          </Button>
        </Grid>
      </DialogContent>
    </div>
  );
}

// "prestart": "generate-env-getter js && prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
// "pretest": "generate-env-getter js && prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
// "prettier": "prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
