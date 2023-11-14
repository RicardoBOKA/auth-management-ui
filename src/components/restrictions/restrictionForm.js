import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import { Button, Box, TextField } from '@mui/material';
import axios from 'axios';

export default function RestrictionForm() {
  const [data, setData] = useState([]);
  const [restrictionId, setRestrictionId] = React.useState('');
  const [result, setResult] = React.useState('');

  const [target_name, setTarget_Name] = useState(['']);
  const [target_id, setTarget_Id] = useState(['']);

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
  const handleDelete = () => {
    axios
      .delete(`http://localhost:8085/v1/restrictions/${restrictionId}`, {
        headers: {
          accept: 'application/json'
        }
      })
      .then(() => {
        setResult(`Suppression réussie pour l'ID : ${restrictionId}`);
      })
      .catch((error) => {
        setResult(`Error : ${error.message}`);
      });
  };

  const postData = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8085/v1/restrictions/?target_name=servicePath&target_id=4947cb5e-9f8d-4088-89e0-c6116b20d630`,
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h2>Get Restrictions</h2>
        <Button variant="contained" color="primary" onClick={fetchData}>
          Get Restrictions
        </Button>
      </Grid>

      <Grid item xs={12}>
        {data.map((item, index) => (
          <Box
            key={index}
            component="span"
            sx={{
              display: 'block',
              p: 1,
              m: 1,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#101010' : '#fff'),
              color: (theme) => (theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800'),
              border: '1px solid',
              borderColor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.300')
            }}
          >
            {item.id}
          </Box>
        ))}
      </Grid>

      <Grid item xs={12}>
        <h2>Post a Restriction</h2>
        <TextField
          type="text"
          id="target table"
          label="Target"
          variant="outlined"
          value={target_name}
          onChange={() => setTarget_Name(target_name)}
        />
        <TextField
          type="text"
          id="target id"
          label="Target ID"
          variant="outlined"
          value={target_id}
          onChange={() => setTarget_Id(target_id)}
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
