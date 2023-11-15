import React, { useState, useEffect } from 'react';
import RestrictionTable from './restrictionTable';
import Grid from '@mui/material/Grid';
import { Button, TextField, Autocomplete, Box } from '@mui/material';
import axios from 'axios';

export default function RestrictionForm() {
  const [data, setData] = useState([]);
  const [restrictionId, setRestrictionId] = React.useState('');
  const [result, setResult] = React.useState('');

  const [target_name, setTarget_Name] = useState(['']);
  const [target_id, setTarget_Id] = useState(['']);

  const [name, setName] = useState('');
  const handleAutocompleteChange = (event, newValue) => {
    console.log('---');
    console.log('1');
    console.log(newValue.name);
    console.log('---');
    setName(newValue.name);
  };
  const options = [{ name: 'Time Restriction' }, { name: 'String' }, { name: 'Start Restriction' }];

  const handleDelete = () => {
    axios
      .delete(`http://localhost:8085/v1/restrictions/${restrictionId}`, {
        headers: {
          accept: 'application/json'
        }
      })
      .then(() => {
        fetchData();
        setResult(`Suppression réussie pour l'ID : ${restrictionId}`);
      })
      .catch((error) => {
        setResult(`Error : ${error.message}`);
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8085/v1/restrictions/', {
        headers: { Accept: 'application/json' }
      });
      setData(response.data);
    } catch (error) {
      console.error('Erreur lors de la requête GET :', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const postData = async () => {
    console.log('---');
    console.log('2');
    console.log(typeof name);
    console.log(name);
    console.log('---');
    try {
      const response = await axios.post(
        `http://localhost:8085/v1/restrictions/?target_name=${target_name}&target_id=${target_id}`,
        {
          name: name
        },
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('3');
      console.log(response.data);
      fetchData();
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
    }
  };

  return (
    <Grid container spacing={2}>
      <RestrictionTable data={data}>
        <Box> Restrction </Box>
      </RestrictionTable>

      <Grid item xs={12} sx={{ flexDirection: 'column', alignItems: 'center', marginBottom: 2 }}>
        <h2>Post a Restriction</h2>
        <Autocomplete
          disablePortal
          id="restrction-name"
          options={options}
          sx={{ marginBottom: 2, width: '100%' }}
          getOptionLabel={(option) => option.name}
          getOptionSelected={(option, value) => option.name === value.name}
          renderInput={(params) => <TextField {...params} label="Movie" />}
          onChange={handleAutocompleteChange}
          value={options.find((option) => option.name === name) || 'Non defini'}
        />
        <TextField
          type="text"
          id="target table"
          label="Target"
          variant="outlined"
          value={target_name}
          onChange={(e) => setTarget_Name(e.target.value)}
          sx={{ marginBottom: 2, width: '50%' }}
        />
        <TextField
          type="text"
          id="target id"
          label="Target ID"
          variant="outlined"
          value={target_id}
          onChange={(e) => setTarget_Id(e.target.value)}
          sx={{ marginBottom: 2, width: '50%' }}
        />
        <Button variant="contained" color="primary" onClick={postData}>
          Post
        </Button>
      </Grid>

      <Grid item xs={12}>
        <h2>Delete Restriction</h2>
        <TextField
          type="text"
          label="ID Restriction"
          placeholder="ID Restriction"
          variant="outlined"
          fullWidth
          value={restrictionId}
          onChange={(e) => setRestrictionId(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleDelete}>
          Delete
        </Button>
        <div>{result}</div>
      </Grid>
    </Grid>
  );
}
